import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/drizzle/db';
import { projectManagers } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

// GET /api/projects/:projectId/budgets -> list budgets per PM (admin/mod)
export async function GET(_req: NextRequest, ctx: { params: Promise<{ projectId: string }> }) {
	const { projectId } = await ctx.params;
	const rows = await db.select().from(projectManagers).where(eq(projectManagers.projectId, projectId));
	return NextResponse.json({ managers: rows.map(r => ({ userId: (r as any).userId })) });
}

// POST /api/projects/:projectId/budgets -> set/top-up a PM budget (admin/mod)
export async function POST(req: NextRequest, ctx: { params: Promise<{ projectId: string }> }) {
	const { projectId } = await ctx.params;
	const body = await req.json().catch(() => null) as any;
	const userId = body?.userId as string | undefined;
	if (!userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 });
	const [row] = await db
		.insert(projectManagers)
		.values({ projectId, userId })
		.onConflictDoNothing()
		.returning();
	return NextResponse.json({ manager: row ?? { userId } }, { status: 201 });
}
