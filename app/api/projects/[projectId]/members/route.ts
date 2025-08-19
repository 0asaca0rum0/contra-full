import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/drizzle/db';
import { users, employees, projectManagers } from '@/drizzle/schema';
import { eq, sql, and, inArray } from 'drizzle-orm';

function extractProjectId(path: string) { const parts = path.split('/'); const i = parts.indexOf('projects'); return i>=0? parts[i+1]: undefined; }

// GET /api/projects/:projectId/members -> list PMs & employees on project
export async function GET(req: NextRequest) {
	const projectId = extractProjectId(req.nextUrl.pathname)!;
	const [pms, emps, admins] = await Promise.all([
		db
			.select({ userId: projectManagers.userId })
			.from(projectManagers)
			.where(eq(projectManagers.projectId, projectId)),
		db
			.select({ id: employees.id, name: employees.name })
			.from(employees)
			.where(eq(employees.projectId, projectId)),
		db.select({ id: users.id, username: users.username, role: users.role }).from(users).where(eq(users.role, 'ADMIN')),
	]);
	// Combine explicit PMs + implicit admins
	const pmUserIds = new Set(pms.map(p => p.userId));
	for (const adm of admins) pmUserIds.add(adm.id);
	const idsArr = Array.from(pmUserIds.values());
	const pmUsers = idsArr.length
		? await db.select({ id: users.id, username: users.username, role: users.role }).from(users).where(inArray(users.id, idsArr))
		: [];
	return NextResponse.json({ managers: idsArr.map(id => ({ userId: id })), employees: emps, users: pmUsers, implicitAdmins: admins.map(a=>a.id) });
}

// POST /api/projects/:projectId/members -> add user to project
export async function POST(req: NextRequest) {
		const projectId = extractProjectId(req.nextUrl.pathname)!;
		const body = await req.json().catch(() => null) as any;
		const userId = body?.userId as string | undefined;
		if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });
		// Detect legacy NOT NULL budget column presence once per request
		let hasLegacyBudget = false;
		try {
			const chk: any = await db.execute(sql`SELECT 1 FROM information_schema.columns WHERE table_name='project_managers' AND column_name='budget' LIMIT 1` as any);
			hasLegacyBudget = Array.isArray(chk?.rows) ? chk.rows.length > 0 : (chk as any).rowCount > 0;
		} catch {}

		let inserted: any[] = [];
		if (hasLegacyBudget) {
			// Use raw SQL including budget=0 to satisfy legacy NOT NULL constraint
			const raw = await db.execute(sql`INSERT INTO project_managers (project_id, user_id, budget)
				VALUES (${projectId}, ${userId}, 0)
				ON CONFLICT DO NOTHING
				RETURNING id, project_id, user_id` as any);
			inserted = (raw as any).rows || [];
		} else {
			inserted = await db
				.insert(projectManagers)
				.values({ projectId, userId } as any)
				.onConflictDoNothing()
				.returning();
		}
		return NextResponse.json({ manager: inserted[0] ?? { userId }, legacyBudgetColumn: hasLegacyBudget }, { status: 201 });
}

// DELETE /api/projects/:projectId/members -> remove user from project
export async function DELETE(req: NextRequest) {
	const projectId = extractProjectId(req.nextUrl.pathname)!;
	const { searchParams } = new URL(req.url);
	const userId = searchParams.get('userId');
	if (!userId) return NextResponse.json({ error: 'userId query param required' }, { status: 400 });
	const [deleted] = await db
		.delete(projectManagers)
		.where(and(eq(projectManagers.projectId, projectId), eq(projectManagers.userId, userId)))
		.returning({ userId: projectManagers.userId });
	if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 });
	return NextResponse.json({ success: true });
}
