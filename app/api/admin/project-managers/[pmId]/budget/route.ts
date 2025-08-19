import { NextRequest } from 'next/server';

// POST /api/admin/project-managers/:pmId/budget (Admin only)
export async function POST(_req: NextRequest, ctx: { params: Promise<{ pmId: string }> }) {
  const { pmId } = await ctx.params;
  // TODO: Add to PM's budget for a project
  return new Response(JSON.stringify({ message: 'Add to PM budget endpoint stub', pmId }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
