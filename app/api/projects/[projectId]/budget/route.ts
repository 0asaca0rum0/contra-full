import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/drizzle/db';
import { projectManagers, transactions } from '@/drizzle/schema';
import { eq, sql } from 'drizzle-orm';

// GET /api/projects/:projectId/budget (Admin/Mod)
export async function GET(_req: NextRequest, ctx: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await ctx.params;
  // Compute total allocated from pm_budgets
  try {
    const allocations = await db.select({ amount: projectManagers.budget }).from(projectManagers).where(eq(projectManagers.projectId, projectId));
    const allocated = allocations.reduce((s, r) => s + Number(r.amount || 0), 0);
    const spentRes = await db.execute(sql`SELECT COALESCE(SUM(amount), 0) AS spent FROM transactions WHERE project_id = ${projectId}`);
    const spent = Number((spentRes as any).rows?.[0]?.spent ?? 0);
    return NextResponse.json({
      totalBudget: allocated,
      spent,
      remaining: allocated - spent,
  source: 'project_managers_budget_sum'
    });
  } catch (e: any) {
    console.error('budget GET error', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
