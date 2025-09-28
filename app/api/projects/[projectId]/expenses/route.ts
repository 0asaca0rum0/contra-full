import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/drizzle/db';
import { transactions, projectManagers } from '@/drizzle/schema';
import { and, eq, gte, lt, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { loadAuthContext, hasRequired } from '@/lib/authz';
import { normalizeReceiptStorage, normalizeReceiptUrl } from '@/lib/receipts';

type TransactionRow = typeof transactions.$inferSelect;
type ExpensePayload = {
  amount?: number;
  description?: string;
  userId?: string;
  supplierId?: string | null;
  receiptKey?: string;
  receiptUrl?: string;
};

// GET /api/projects/:projectId/expenses?from=YYYY-MM-DD&to=YYYY-MM-DD
export async function GET(req: NextRequest, ctx: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await ctx.params;
  const { searchParams } = new URL(req.url);
  const fromStr = searchParams.get('from');
  const toStr = searchParams.get('to');
  const filters: SQL[] = [eq(transactions.projectId, projectId)];
  if (fromStr) {
    const from = new Date(fromStr);
    if (!Number.isNaN(from.getTime())) filters.push(gte(transactions.createdAt, from));
  }
  if (toStr) {
    const to = new Date(toStr);
    if (!Number.isNaN(to.getTime())) filters.push(lt(transactions.createdAt, to));
  }
  const whereClause = filters.length === 1 ? filters[0] : and(...filters);
  const rows = await db.select().from(transactions).where(whereClause) as TransactionRow[];
  const expenses = rows.map((row) => ({
    ...row,
    receiptUrl: normalizeReceiptUrl(row.receiptUrl)
  }));
  console.log('[ProjectExpensesAPI] normalized expenses', {
    projectId,
    count: expenses.length,
    receipts: expenses
      .map(exp => exp.receiptUrl)
      .filter(Boolean)
      .slice(0, 10)
  });
  return NextResponse.json({ expenses });
}

// POST /api/projects/:projectId/expenses
export async function POST(req: NextRequest, ctx: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await ctx.params;
  const auth = await loadAuthContext();
  if (!auth.userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!hasRequired(auth.permissions, { anyOf: ['ALL','EXPENSE_CREATE'] })) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const body = (await req.json().catch(() => null)) as ExpensePayload | null;
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
  const spentRes = await db.execute(sql`SELECT COALESCE(SUM(amount),0)::numeric AS spent FROM transactions WHERE project_id = ${projectId} AND user_id = ${userId};`);
  const spentRows = (spentRes as unknown as { rows?: Array<Record<string, unknown>> }).rows ?? [];
  const spentValue = spentRows[0]?.spent;
  const spent = Number(typeof spentValue === 'number' ? spentValue : typeof spentValue === 'string' ? Number(spentValue) : 0);
      const remaining = allocated - spent;
      if (amount > remaining) {
        return NextResponse.json({ error: 'allocation_exceeded', details: { allocated, spent, remaining, attempted: amount } }, { status: 400 });
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error';
    return NextResponse.json({ error: 'allocation_check_failed', message }, { status: 500 });
  }
  try {
    const rawReceipt = typeof body?.receiptKey === 'string'
      ? body.receiptKey
      : typeof body?.receiptUrl === 'string'
        ? body.receiptUrl
        : undefined;
    const normalizedReceipt = rawReceipt ? normalizeReceiptStorage(rawReceipt) : undefined;
    const [created] = await db.insert(transactions).values({ amount, description, projectId, userId, supplierId: supplierId ?? undefined, receiptUrl: normalizedReceipt }).returning();
    const expense = { ...created, receiptUrl: normalizeReceiptUrl(created.receiptUrl) };
    console.log('[ProjectExpensesAPI] created expense', {
      projectId,
      expenseId: expense.id,
      hasReceipt: Boolean(expense.receiptUrl)
    });
    return NextResponse.json({ expense }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error';
    return NextResponse.json({ error: 'insert_failed', message }, { status: 500 });
  }
}
