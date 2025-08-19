import { NextRequest } from 'next/server';

// PUT /api/admin/projects/:projectId/managers/:pmId (Admin only)
export async function PUT(_req: NextRequest, ctx: { params: Promise<{ projectId: string, pmId: string }> }) {
  const { projectId, pmId } = await ctx.params;
  // TODO: Update PM's budget for project
  return new Response(JSON.stringify({ message: 'Update PM budget endpoint stub', projectId, pmId }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

// DELETE /api/admin/projects/:projectId/managers/:pmId (Admin only)
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ projectId: string, pmId: string }> }) {
  const { projectId, pmId } = await ctx.params;
  // TODO: Remove PM from project
  return new Response(JSON.stringify({ message: 'Remove PM endpoint stub', projectId, pmId }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
