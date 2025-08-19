import { NextRequest } from 'next/server';

// PUT /api/admin/projects/:projectId (Admin only)
export async function PUT(_req: NextRequest, ctx: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await ctx.params;
  // TODO: Update project
  return new Response(JSON.stringify({ message: 'Update project endpoint stub', projectId }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

// DELETE /api/admin/projects/:projectId (Admin only)
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await ctx.params;
  // TODO: Delete project
  return new Response(JSON.stringify({ message: 'Delete project endpoint stub', projectId }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
