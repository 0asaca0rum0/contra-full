import { NextRequest } from 'next/server';

// POST /api/auth/signup (Admin only)
export async function POST(_req: NextRequest) {
  // TODO: Implement signup logic (Admin only)
  return new Response(JSON.stringify({ message: 'Signup endpoint stub' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
