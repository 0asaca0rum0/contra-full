import { NextRequest, NextResponse } from 'next/server';
import { localFileAbsolute } from '@/lib/s3';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Magic bytes signatures for allowed file types
const MAGIC_BYTES: Record<string, { signature: number[]; offset?: number }> = {
  'image/png': { signature: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] },
  'image/jpeg': { signature: [0xFF, 0xD8, 0xFF] },
  'application/pdf': { signature: [0x25, 0x50, 0x44, 0x46] }, // %PDF
};

// Allowed file extensions mapped to MIME types
const ALLOWED_EXTENSIONS: Record<string, string> = {
  'png': 'image/png',
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'pdf': 'application/pdf',
};

function validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
  const magic = MAGIC_BYTES[mimeType];
  if (!magic) return false;
  const offset = magic.offset || 0;
  if (buffer.length < offset + magic.signature.length) return false;
  for (let i = 0; i < magic.signature.length; i++) {
    if (buffer[offset + i] !== magic.signature[i]) return false;
  }
  return true;
}

function getExtensionFromKey(key: string): string {
  const ext = key.split('.').pop()?.toLowerCase() || '';
  return ext.replace(/[^a-z0-9]/g, '');
}

function sanitizeKey(key: string): string | null {
  // Normalize path separators and remove any null bytes
  let sanitized = key.replace(/\\/g, '/').replace(/\0/g, '');
  // Remove any leading slashes
  sanitized = sanitized.replace(/^\/+/, '');
  // Normalize to remove any . or .. segments
  const segments = sanitized.split('/').filter(Boolean);
  const safe: string[] = [];
  for (const seg of segments) {
    if (seg === '..') return null; // Path traversal attempt
    if (seg === '.') continue; // Skip current directory
    safe.push(seg);
  }
  return safe.join('/');
}

export async function POST(req: NextRequest) {
  const rawKey = (req.nextUrl.searchParams.get('key') || '');
  
  // Sanitize and validate the key
  const key = sanitizeKey(rawKey);
  if (!key) {
    return NextResponse.json({ error: 'invalid key - path traversal detected' }, { status: 400 });
  }

  // Validate content type is multipart
  const contentType = req.headers.get('content-type') || '';
  if (!contentType.startsWith('multipart/form-data')) {
    return NextResponse.json({ error: 'multipart/form-data required' }, { status: 400 });
  }

  // Parse form data
  const formData = await req.formData();
  const file = formData.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'file field required' }, { status: 400 });
  }

  // Size limit (10MB)
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'file too large (10MB limit)' }, { status: 413 });
  }

  // Validate file extension from key
  const ext = getExtensionFromKey(key);
  const expectedMime = ALLOWED_EXTENSIONS[ext];
  if (!expectedMime) {
    return NextResponse.json({ error: `unsupported file extension: ${ext}` }, { status: 415 });
  }

  // Validate claimed MIME type
  const claimedType = file.type || '';
  if (!ALLOWED_EXTENSIONS[ext] || (claimedType && claimedType !== expectedMime)) {
    // Allow empty claimed type but if provided, must match expected
    if (claimedType && claimedType !== expectedMime) {
      return NextResponse.json({ error: 'file type mismatch with extension' }, { status: 415 });
    }
  }

  // Read file content
  const arrayBuffer = await file.arrayBuffer();
  const buf = Buffer.from(arrayBuffer);

  // CRITICAL: Validate magic bytes to prevent fake file type attacks
  if (!validateMagicBytes(buf, expectedMime)) {
    return NextResponse.json({ 
      error: 'file content does not match claimed type - security violation' 
    }, { status: 415 });
  }

  // Compute absolute path and ensure it's within the uploads directory
  const abs = localFileAbsolute(key);
  const uploadsBase = path.resolve(process.cwd(), process.env.LOCAL_UPLOAD_DIR || 'uploads');
  const resolvedAbs = path.resolve(abs);
  
  // Final path traversal check - ensure resolved path is within uploads directory
  if (!resolvedAbs.startsWith(uploadsBase)) {
    return NextResponse.json({ error: 'invalid storage path' }, { status: 400 });
  }

  // Create directory and write file
  const dir = path.dirname(abs);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(abs, buf);
  
  console.log('FILE_UPLOADED', { key, size: buf.length, abs, validatedType: expectedMime });
  
  return NextResponse.json(
    { stored: true, key, size: buf.length },
    { 
      headers: {
        'X-Content-Type-Options': 'nosniff',
      }
    }
  );
}
