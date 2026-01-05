import { NextResponse } from 'next/server';
import { requireAuth } from '../../../../lib/auth';

export async function POST(req: Request) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();
    const { filename, contentType } = body;
    if (!filename) return NextResponse.json({ error: 'filename required' }, { status: 400 });

    // sanitize filename
    const safeName = filename.replace(/[^a-zA-Z0-9.-_]/g, '-');
    const key = `${user.id}/${Date.now()}-${safeName}`;

    // For local development without S3, use direct upload endpoint
    const uploadUrl = `/api/uploads/direct`;
    const publicUrl = `/uploads/${key}`;
    
    return NextResponse.json({ 
      url: uploadUrl, 
      publicUrl, 
      key,
      useDirectUpload: true // Flag to tell client to use different upload method
    });
  } catch (e: any) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: e?.message || 'Unable to generate presigned URL' }, { status: 500 });
  }
}