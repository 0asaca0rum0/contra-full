import { NextRequest } from 'next/server';

// POST /api/admin/projects/:projectId/managers (Admin only)
export async function POST(_req: NextRequest, ctx: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await ctx.params;
  // TODO: Assign PM to project with budget
  return new Response(JSON.stringify({ message: 'Assign PM endpoint stub', projectId }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
