import { NextRequest } from 'next/server';
import { localFileAbsolute } from '@/lib/s3';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, ctx: { params: Promise<{ key: string[] }> }) {
  const { key } = await ctx.params;
  const rel = key.join('/');
  if (!rel || rel.includes('..')) return new Response('Bad key', { status: 400 });
  const abs = localFileAbsolute(rel);
  if (!fs.existsSync(abs)) return new Response('Not found', { status: 404 });
  const data = fs.readFileSync(abs);
  // Basic content type sniff
  let ct = 'application/octet-stream';
  if (rel.match(/\.png$/i)) ct = 'image/png';
  else if (rel.match(/\.(jpg|jpeg)$/i)) ct = 'image/jpeg';
  else if (rel.match(/\.pdf$/i)) ct = 'application/pdf';
  return new Response(data, { status: 200, headers: { 'content-type': ct, 'cache-control': 'public, max-age=31536000, immutable' } });
}
