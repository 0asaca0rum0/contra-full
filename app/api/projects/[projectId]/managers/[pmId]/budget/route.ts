import { NextRequest } from 'next/server';

// PATCH /api/projects/:projectId/managers/:pmId/budget (Admin)
export async function PATCH(_req: NextRequest, ctx: { params: Promise<{ projectId: string, pmId: string }> }) {
  const { projectId, pmId } = await ctx.params;
  // TODO: Add to PM's budget (partial update)
  return new Response(JSON.stringify({ message: 'Patch PM budget endpoint stub', projectId, pmId }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
