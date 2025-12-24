import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/drizzle/db';
import { projects } from '@/drizzle/schema';
import { ilike, eq, sql } from 'drizzle-orm';

// GET /api/projects -> list projects (scope by role)
export async function GET(req: NextRequest) {
	const { searchParams } = new URL(req.url);
	const q = searchParams.get('q');
	
	// Join with projectManagers to get the sum of budgets
	const rows = await db.execute(sql`
		SELECT 
			p.id, 
			p.name, 
			COALESCE(SUM(pm.budget), 0) AS "totalBudget"
		FROM projects p
		LEFT JOIN project_managers pm ON p.id = pm.project_id
		${q ? sql`WHERE p.name ILIKE ${'%' + q + '%'}` : sql``}
		GROUP BY p.id, p.name
	`);

	return NextResponse.json({ projects: rows.rows });
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
