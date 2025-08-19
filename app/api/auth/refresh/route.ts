import { NextRequest } from 'next/server';

// POST /api/auth/refresh - Refresh access token
export async function POST(_req: NextRequest) {
  // TODO: Refresh access token
  return new Response(JSON.stringify({ message: 'Refresh token endpoint stub' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
