import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const ALLOWED_TYPES: Record<string, { mime: string; magic: number[] }> = {
  'image/jpeg': { mime: 'image/jpeg', magic: [0xff, 0xd8, 0xff] },
  'image/png': { mime: 'image/png', magic: [0x89, 0x50, 0x4e, 0x47] },
  'image/webp': { mime: 'image/webp', magic: [0x52, 0x49, 0x46, 0x46] },
  'image/gif': { mime: 'image/gif', magic: [0x47, 0x49, 0x46] },
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;

function validateMagicBytes(buffer: ArrayBuffer, expected: number[]): boolean {
  const bytes = new Uint8Array(buffer);
  if (bytes.length < expected.length) return false;
  return expected.every((byte, i) => bytes[i] === byte);
}

function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.{2,}/g, '.')
    .substring(0, 100);
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rl = rateLimit(`upload:${session.user.id}`, { limit: 20, windowMs: 60 * 1000 });
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Too many uploads. Try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) } }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const category = (formData.get('category') as string) || 'general';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    const typeInfo = ALLOWED_TYPES[file.type];
    if (!typeInfo) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF' },
        { status: 400 }
      );
    }

    const buffer = await file.arrayBuffer();
    if (!validateMagicBytes(buffer, typeInfo.magic)) {
      return NextResponse.json(
        { error: 'File content does not match declared type. Upload rejected.' },
        { status: 400 }
      );
    }

    const ext = file.name.split('.').pop() || 'jpg';
    const hash = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now();
    const safeName = sanitizeFilename(`${timestamp}-${hash}.${ext}`);

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', category, session.user.id);
    await mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, safeName);
    await writeFile(filePath, Buffer.from(buffer));

    const publicUrl = `/uploads/${category}/${session.user.id}/${safeName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename: safeName,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed. Please try again.' },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};