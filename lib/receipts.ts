import { publicUrlForKey } from '@/lib/s3';

const API_PREFIX = '/api/files/';
const STRIP_GUARD = 5;

export function normalizeReceiptStorage(raw: string) {
  return stripApiFilesPrefix(raw);
}

export function normalizeReceiptUrl(stored: string | null | undefined) {
  if (!stored) return null;
  const key = stripApiFilesPrefix(stored);
  return publicUrlForKey(key);
}

export function stripApiFilesPrefix(value: string) {
  let current = value.trim();
  let attempts = 0;
  while (current.startsWith(API_PREFIX) && attempts < STRIP_GUARD) {
    const encoded = current.slice(API_PREFIX.length);
    try {
      current = decodeURIComponent(encoded);
    } catch {
      current = encoded;
    }
    attempts += 1;
  }
  return current;
}
