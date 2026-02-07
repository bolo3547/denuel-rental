import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../../../lib/auth';
import { put } from '@vercel/blob';
import prisma from '../../../../lib/prisma';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
    }

    // Validate file size (5MB max for avatars)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image must be less than 5MB' }, { status: 400 });
    }

    // Check storage backends
    const hasS3 = process.env.AWS_REGION && process.env.S3_BUCKET && process.env.AWS_ACCESS_KEY_ID;
    let publicUrl: string;

    if (hasS3) {
      // Use S3
      const key = `avatars/${user.id}/${Date.now()}-avatar.jpg`;
      const buffer = Buffer.from(await file.arrayBuffer());
      const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
      const s3 = new S3Client({ region: process.env.AWS_REGION });
      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.S3_BUCKET,
          Key: key,
          Body: buffer,
          ContentType: file.type,
        })
      );
      publicUrl = `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    } else if (process.env.BLOB_READ_WRITE_TOKEN) {
      // Use Vercel Blob
      const pathname = `avatars/${user.id}/${Date.now()}-avatar`;
      const blob = await put(pathname, file, {
        access: 'public',
        addRandomSuffix: false,
      });
      publicUrl = blob.url;
    } else {
      return NextResponse.json(
        { error: 'File storage is not configured' },
        { status: 500 }
      );
    }

    // Update user profile image in database
    await prisma.user.update({
      where: { id: user.id },
      data: { profileImage: publicUrl },
    });

    return NextResponse.json({
      success: true,
      profileImage: publicUrl,
    });
  } catch (e: any) {
    if (e instanceof Response) return e;
    console.error('Avatar upload error:', e);
    return NextResponse.json(
      { error: e?.message || 'Upload failed' },
      { status: 500 }
    );
  }
}