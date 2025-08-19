import { NextRequest, NextResponse } from 'next/server';
import { localFileAbsolute } from '@/lib/s3';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const key = (req.nextUrl.searchParams.get('key') || '').replace(/\\\\/g,'/');
  if (!key || key.includes('..')) return NextResponse.json({ error: 'invalid key' }, { status: 400 });
  const contentType = req.headers.get('content-type') || '';
  if (!contentType.startsWith('multipart/form-data')) {
    return NextResponse.json({ error: 'multipart/form-data required' }, { status: 400 });
  }
  const formData = await req.formData();
  const file = formData.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'file field required' }, { status: 400 });
  if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: 'file too large (10MB limit)' }, { status: 413 });
  const allowed = ['image/png','image/jpeg','application/pdf'];
  const fileType = file.type || '';
  if (!allowed.includes(fileType)) {
    return NextResponse.json({ error: 'unsupported file type' }, { status: 415 });
  }
  const arrayBuffer = await file.arrayBuffer();
  const abs = localFileAbsolute(key);
  const dir = path.dirname(abs);
  fs.mkdirSync(dir, { recursive: true });
  const buf = Buffer.from(arrayBuffer);
  fs.writeFileSync(abs, buf);
  console.log('FILE_UPLOADED', { key, size: buf.length, abs });
  return NextResponse.json({ stored: true, key, size: buf.length });
}
