import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/drizzle/db';
import { transactions, projectManagers } from '@/drizzle/schema';
import { and, eq, gte, lt, sql } from 'drizzle-orm';
import { loadAuthContext, hasRequired } from '@/lib/authz';

// GET /api/projects/:projectId/expenses?from=YYYY-MM-DD&to=YYYY-MM-DD
export async function GET(req: NextRequest, ctx: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await ctx.params;
  const { searchParams } = new URL(req.url);
  const fromStr = searchParams.get('from');
  const toStr = searchParams.get('to');
  const where = [eq(transactions.projectId, projectId)];
  if (fromStr) {
    const from = new Date(fromStr);
    if (!isNaN(from.getTime())) where.push(gte(transactions.createdAt, from as any));
  }
  if (toStr) {
    const to = new Date(toStr);
    if (!isNaN(to.getTime())) where.push(lt(transactions.createdAt, to as any));
  }
  const rows = await db.select().from(transactions).where(and(...where as any));
  return NextResponse.json({ expenses: rows });
}

// POST /api/projects/:projectId/expenses
export async function POST(req: NextRequest, ctx: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await ctx.params;
  const auth = await loadAuthContext();
  if (!auth.userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!hasRequired(auth.permissions, { anyOf: ['ALL','EXPENSE_CREATE'] })) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const body = await req.json().catch(() => null) as any;
  const amount = Number(body?.amount);
  const description = body?.description as string | undefined;
  const userId = body?.userId as string | undefined; // PM whose allocation is used
  const supplierId = body?.supplierId as string | undefined | null;
  if (!Number.isFinite(amount) || amount <= 0 || !description || !userId) {
    return NextResponse.json({ error: 'amount (>0), description, userId are required' }, { status: 400 });
  }
  // If caller is PM ensure they can only create for themselves (unless ALL)
  if (!auth.permissions.includes('ALL') && auth.userId !== userId) {
    return NextResponse.json({ error: 'cannot create expense for another user' }, { status: 403 });
  }
  try {
    // Fetch allocation from project_managers row (current budget) if exists
    const allocRow = await db.select({ budget: projectManagers.budget }).from(projectManagers)
      .where(and(eq(projectManagers.projectId, projectId), eq(projectManagers.userId, userId)))
      .limit(1);
    const allocated = Number(allocRow[0]?.budget ?? 0);
    if (allocated > 0) {
      const spentRes = await db.execute(sql`SELECT COALESCE(SUM(amount),0)::numeric AS spent FROM transactions WHERE project_id = ${projectId} AND user_id = ${userId};` as any);
      const spent = Number((spentRes as any).rows?.[0]?.spent ?? 0);
      const remaining = allocated - spent;
      if (amount > remaining) {
        return NextResponse.json({ error: 'allocation_exceeded', details: { allocated, spent, remaining, attempted: amount } }, { status: 400 });
      }
    }
  } catch (e: any) {
    return NextResponse.json({ error: 'allocation_check_failed', message: e?.message }, { status: 500 });
  }
  try {
    const [created] = await db.insert(transactions).values({ amount, description, projectId, userId, supplierId: supplierId ?? undefined }).returning();
    return NextResponse.json({ expense: created }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: 'insert_failed', message: e?.message }, { status: 500 });
  }
}
