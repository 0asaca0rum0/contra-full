import { NextRequest } from 'next/server';

// POST /api/upload (for receipt images)
export async function POST(_req: NextRequest) {
  // TODO: Upload file and return URL
  return new Response(JSON.stringify({ message: 'Upload endpoint stub' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
