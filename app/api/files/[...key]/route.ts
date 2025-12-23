import { NextRequest } from 'next/server';
import { localFileAbsolute } from '@/lib/s3';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Allowed extensions and their MIME types
const ALLOWED_TYPES: Record<string, string> = {
  'png': 'image/png',
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'pdf': 'application/pdf',
};

function sanitizePath(segments: string[]): string | null {
  const safe: string[] = [];
  for (const seg of segments) {
    // Reject any segment that tries path traversal
    if (seg === '..' || seg.includes('\0')) return null;
    if (seg === '.') continue;
    safe.push(seg);
  }
  return safe.join('/');
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ key: string[] }> }) {
  const { key } = await ctx.params;
  
  // Sanitize path segments
  const rel = sanitizePath(key);
  if (!rel) return new Response('Bad key - security violation', { status: 400 });
  
  // Validate file extension
  const ext = rel.split('.').pop()?.toLowerCase() || '';
  const contentType = ALLOWED_TYPES[ext];
  if (!contentType) {
    return new Response('Unsupported file type', { status: 415 });
  }
  
  // Get absolute path
  const abs = localFileAbsolute(rel);
  
  // Verify path is within uploads directory (prevent path traversal)
  const uploadsBase = path.resolve(process.cwd(), process.env.LOCAL_UPLOAD_DIR || 'uploads');
  const resolvedAbs = path.resolve(abs);
  if (!resolvedAbs.startsWith(uploadsBase)) {
    return new Response('Invalid path', { status: 400 });
  }
  
  // Check file exists
  if (!fs.existsSync(abs)) return new Response('Not found', { status: 404 });
  
  const data = fs.readFileSync(abs);
  const filename = path.basename(rel);
  
  // Security headers to prevent XSS and MIME sniffing attacks
  return new Response(data, { 
    status: 200, 
    headers: { 
      'Content-Type': contentType,
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'",
      'Content-Disposition': `inline; filename="${filename}"`,
      'Cache-Control': 'public, max-age=31536000, immutable',
    } 
  });
}
