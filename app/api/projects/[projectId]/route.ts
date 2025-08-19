import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/drizzle/db';
import { projects, employees, projectManagers, attendance, warehouseTransactions, transactions, pmBudgets } from '@/drizzle/schema';
import { eq, sql, and, inArray } from 'drizzle-orm';

// Extract dynamic id from pathname segments
function extractProjectId(pathname: string): string | undefined {
	const parts = pathname.split('/');
	const idx = parts.indexOf('projects');
	return idx >= 0 ? parts[idx + 1] : undefined;
}

// GET /api/projects/:projectId -> get project details
export async function GET(req: NextRequest) {
	const projectId = extractProjectId(req.nextUrl.pathname)!;
	const row = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
	const project = row[0];
	if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });
	return NextResponse.json({ project });
}

// PATCH /api/projects/:projectId -> update project
export async function PATCH(req: NextRequest) {
	const projectId = extractProjectId(req.nextUrl.pathname)!;
	const body = await req.json().catch(() => null) as any;
	const updates: Partial<{ name: string; totalBudget: number }> = {};
	if (typeof body?.name === 'string') updates.name = body.name;
	if (typeof body?.totalBudget !== 'undefined') {
		const n = Number(body.totalBudget);
		if (!Number.isFinite(n)) return NextResponse.json({ error: 'totalBudget must be a number' }, { status: 400 });
		updates.totalBudget = n;
	}
	if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'No valid fields' }, { status: 400 });
	const [updated] = await db.update(projects).set(updates as any).where(eq(projects.id, projectId)).returning();
	if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
	return NextResponse.json({ project: updated });
}

// DELETE /api/projects/:projectId -> delete project (admin)
export async function DELETE(req: NextRequest) {
	const projectId = extractProjectId(req.nextUrl.pathname)!;
	const url = new URL(req.url);
	const force = url.searchParams.get('force') === '1';
	const debug = url.searchParams.get('debug') === '1';

	const attemptDirect = async () => {
		try {
			const [deleted] = await db.delete(projects).where(eq(projects.id, projectId)).returning({ id: projects.id });
			if (!deleted) return { ok: false, notFound: true };
			return { ok: true };
		} catch (e: any) {
			if (e?.code === '23503') return { ok: false, fk: true, error: e };
			return { ok: false, error: e };
		}
	};

	if (!force) {
		const direct = await attemptDirect();
		if (direct.ok) return NextResponse.json({ success: true, mode: 'direct' });
		if (direct.notFound) return NextResponse.json({ error: 'Not found' }, { status: 404 });
		if (!direct.fk && direct.error) {
			console.error('Project delete error (non-FK)', direct.error);
			// fall through to manual cascade attempt but annotate
		}
	}

	// Manual cascade path (forced or FK error)
	try {
		await db.transaction(async (tx) => {
			// gather employees first
			const empRows = await tx.select({ id: employees.id }).from(employees).where(eq(employees.projectId, projectId));
			const empIds = empRows.map(r => r.id);
			if (empIds.length) await tx.delete(attendance).where(inArray(attendance.employeeId, empIds));
			await tx.delete(projectManagers).where(eq(projectManagers.projectId, projectId));
			await tx.delete(warehouseTransactions).where(eq(warehouseTransactions.projectId, projectId));
			await tx.delete(transactions).where(eq(transactions.projectId, projectId));
			// Only attempt pm_budgets delete if table exists (to avoid aborting tx)
			const pmBudgetsExists = await tx.execute(sql`SELECT 1 FROM information_schema.tables WHERE table_name = 'pm_budgets' LIMIT 1`);
			if ((pmBudgetsExists as any).rows?.length) {
				await tx.delete(pmBudgets).where(eq(pmBudgets.projectId, projectId));
			}
			// delete employees last
			await tx.delete(employees).where(eq(employees.projectId, projectId));
			const [finalDeleted] = await tx.delete(projects).where(eq(projects.id, projectId)).returning({ id: projects.id });
			if (!finalDeleted) throw new Error('Project vanished during manual cascade');
		});
		return NextResponse.json({ success: true, mode: 'manual-cascade', forced: force });
	} catch (cascadeErr: any) {
		console.error('Manual cascade failed', cascadeErr);
		return NextResponse.json({ error: 'Could not delete project (dependencies remain)', detail: debug ? cascadeErr?.message : undefined, code: cascadeErr?.code }, { status: 500 });
	}
}
