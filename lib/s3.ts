// Local file storage for receipts on a single VPS.
// We store under process.env.LOCAL_UPLOAD_DIR (default: ./uploads) and serve via /api/files route.
import fs from 'fs';
import path from 'path';

export interface LocalUploadPlan { key: string; uploadUrl: string; formField: string; }

const baseDir = path.resolve(process.cwd(), process.env.LOCAL_UPLOAD_DIR || 'uploads');

function ensureDir(p: string) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function sanitizeExt(ext: string) {
  return ext.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin';
}

function planLocalAsset(folder: string, ext: string): LocalUploadPlan {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2,'0');
  const id = crypto.randomUUID();
  const safeExt = sanitizeExt(ext);
  const rel = path.posix.join(folder, String(yyyy), String(mm));
  const dir = path.join(baseDir, rel);
  ensureDir(dir);
  const filename = id + '.' + safeExt;
  const key = path.posix.join(rel, filename);
  return { key, uploadUrl: `/api/files/upload?key=${encodeURIComponent(key)}`, formField: 'file' };
}

export function planLocalReceipt(ext: string) : LocalUploadPlan {
  return planLocalAsset('receipts', ext);
}

export function planWarehouseImage(ext: string): LocalUploadPlan {
  return planLocalAsset('warehouse', ext);
}

export function localFileAbsolute(key: string) {
  return path.join(baseDir, key);
}

export function publicUrlForKey(key: string) {
  // Served through API to control access; could expose /files/* via static server config instead.
  return `/api/files/${encodeURIComponent(key)}`;
}
