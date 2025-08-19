import { headers } from 'next/headers';

export async function getBaseUrl() {
  // Prefer explicit env
  const env = process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL;
  if (env) return env.replace(/\/$/, '');

  // Derive from incoming request (server-only)
  try {
    const h = await headers();
    const proto = h.get('x-forwarded-proto') || 'http';
    const host = h.get('x-forwarded-host') || h.get('host');
    if (host) return `${proto}://${host}`;
  } catch {}

  // Sensible local default
  return 'http://localhost:3000';
}

// Helper to support both sync and async headers() across Next versions
// no-op placeholder to avoid breaking existing imports (if any)
