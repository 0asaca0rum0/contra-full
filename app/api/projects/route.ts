import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/drizzle/db';
import { projects } from '@/drizzle/schema';
import { ilike, eq } from 'drizzle-orm';

// GET /api/projects -> list projects (scope by role)
export async function GET(req: NextRequest) {
	const { searchParams } = new URL(req.url);
	const q = searchParams.get('q');
	const rows = q
		? await db.select().from(projects).where(ilike(projects.name, `%${q}%`))
		: await db.select().from(projects);
	return NextResponse.json({ projects: rows });
}

// POST /api/projects -> create project (admin or permitted moderator)
export async function POST(req: NextRequest) {
	const body = await req.json().catch(() => null) as any;
	const name = body?.name;
	const totalBudget = body?.totalBudget !== undefined ? Number(body.totalBudget) : 0;
	if (!name) {
		return NextResponse.json({ error: 'name is required' }, { status: 400 });
	}
	if (body?.totalBudget !== undefined && !Number.isFinite(totalBudget)) {
		return NextResponse.json({ error: 'totalBudget must be a number if provided' }, { status: 400 });
	}
	const [created] = await db.insert(projects).values({ name, totalBudget }).returning();
	return NextResponse.json({ project: created }, { status: 201 });
}
