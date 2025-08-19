import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/drizzle/db';
import { projectManagers, transactions, pmBudgetAudit, users } from '@/drizzle/schema';
import { eq, sql, and } from 'drizzle-orm';
import { loadAuthContext, hasRequired } from '@/lib/authz';

// GET /api/projects/:projectId/pm-budgets -> list allocations + summary
// No history: we expose current allocations (budget column) and allow upsert-like set

export async function GET(_req: NextRequest, ctx: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await ctx.params;
  const auth = await loadAuthContext();
  if (!auth.userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  // Allow read to BUDGET_ADJUST holders or admins (ALL) or Mods; fallback allow if user has PROJECTS_MANAGE and is assigned to project
  // For simplicity now: require one of BUDGET_ADJUST/ALL; else 403 (can relax later)
  if (!hasRequired(auth.permissions, { anyOf: ['ALL','BUDGET_ADJUST'] })) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  try {
    const rows = await db.select({ id: projectManagers.id, userId: projectManagers.userId, budget: projectManagers.budget }).from(projectManagers).where(eq(projectManagers.projectId, projectId));

    // Ensure audit infrastructure exists (id default avoids gen_random_uuid dependency). We no longer rely on triggers; logging handled manually in POST.
    try {
      await db.execute(sql`CREATE TABLE IF NOT EXISTS pm_budget_audit (
        id TEXT PRIMARY KEY DEFAULT md5(random()::text || clock_timestamp()::text),
        project_manager_id TEXT NOT NULL REFERENCES project_managers(id) ON DELETE CASCADE,
        project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        old_budget REAL,
        new_budget REAL NOT NULL,
        change_date DATE NOT NULL DEFAULT CURRENT_DATE,
        changed_at TIMESTAMP NOT NULL DEFAULT now()
      )` as any);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_pm_budget_audit_pm ON pm_budget_audit(project_manager_id)` as any);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_pm_budget_audit_project ON pm_budget_audit(project_id)` as any);
      // Explicitly drop old trigger/function if they exist to avoid double logging
      await db.execute(sql`DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_pm_budget_audit') THEN
          DROP TRIGGER trg_pm_budget_audit ON project_managers; END IF;
        IF EXISTS (SELECT 1 FROM pg_proc WHERE proname='log_pm_budget_change') THEN
          DROP FUNCTION log_pm_budget_change(); END IF; END $$;` as any);
    } catch (ensureErr) {
      console.error('Ensure audit infra error (non-fatal)', ensureErr);
    }

    let history: any[] = [];
    try {
      history = await db.select({
        id: pmBudgetAudit.id,
        projectManagerId: pmBudgetAudit.projectManagerId,
        userId: pmBudgetAudit.userId,
        oldBudget: pmBudgetAudit.oldBudget,
        newBudget: pmBudgetAudit.newBudget,
        changedAt: pmBudgetAudit.changeDate,
      }).from(pmBudgetAudit).where(eq(pmBudgetAudit.projectId, projectId)).orderBy(pmBudgetAudit.changeDate as any);
    } catch (histErr) {
      console.error('History fetch still failing', histErr);
    }
  const allocated = rows.reduce((s, r: any) => s + Number(r.budget || 0), 0);
    const spentRes = await db.execute(sql`SELECT COALESCE(SUM(amount),0) AS spent FROM transactions WHERE project_id = ${projectId}`);
    const spent = Number((spentRes as any).rows?.[0]?.spent ?? 0);
    let diagnostics: any = undefined;
    if ((history as any).length === 0 && rows.length > 0) {
      try {
        const triggerRes: any = await db.execute(sql`SELECT tgname FROM pg_trigger WHERE tgrelid='project_managers'::regclass AND NOT tgisinternal` as any);
        const colRes: any = await db.execute(sql`SELECT column_name FROM information_schema.columns WHERE table_name='pm_budget_audit'` as any);
        diagnostics = { triggers: triggerRes.rows?.map((r: any) => r.tgname), auditColumns: colRes.rows?.map((r: any) => r.column_name) };
      } catch { /* ignore */ }
    }
    // Compute deltas for history items
    const historyWithDelta = history.map(h => ({
      ...h,
      delta: h.oldBudget == null ? h.newBudget : (h.newBudget - h.oldBudget),
    }));
    return NextResponse.json({ allocations: rows, summary: { allocated, spent, remaining: allocated - spent }, history: historyWithDelta, diagnostics });
  } catch (e: any) {
    console.error('pm-budgets GET error', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST /api/projects/:projectId/pm-budgets { userId, amount, note? }
export async function POST(req: NextRequest, ctx: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await ctx.params;
  const auth = await loadAuthContext();
  if (!auth.userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!hasRequired(auth.permissions, { anyOf: ['ALL','BUDGET_ADJUST'] })) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const body = await req.json().catch(() => null) as any;
  const userId = body?.userId as string | undefined;
  const delta = Number(body?.amount ?? body?.delta); // backward compat: amount field
  const dateStr = body?.date as string | undefined; // currently unused; placeholder for future audit history
  if (!userId || !Number.isFinite(delta)) return NextResponse.json({ error: 'userId and numeric delta required' }, { status: 400 });
  if (delta === 0) return NextResponse.json({ error: 'delta cannot be zero' }, { status: 400 });
  try {
    // If manager exists update, else insert with budget
    const existing = await db.select({ id: projectManagers.id }).from(projectManagers).where(and(eq(projectManagers.projectId, projectId), eq(projectManagers.userId, userId))).limit(1);
    // Ensure audit table exists before logging (lightweight)
    try { await db.execute(sql`SELECT 1 FROM pm_budget_audit LIMIT 1` as any); } catch { /* GET path will create */ }

    if (existing.length) {
      const current = await db.select({ budget: projectManagers.budget }).from(projectManagers).where(eq(projectManagers.id, existing[0].id)).limit(1);
      const oldBudget = Number(current[0]?.budget || 0);
      const newBudget = oldBudget + delta;
      if (newBudget < 0) return NextResponse.json({ error: 'resulting budget would be negative', oldBudget, delta }, { status: 400 });
      const [updated] = await db.update(projectManagers).set({ budget: newBudget } as any).where(eq(projectManagers.id, existing[0].id)).returning();
      try { await db.execute(sql`INSERT INTO pm_budget_audit (project_manager_id, project_id, user_id, old_budget, new_budget) VALUES (${existing[0].id}, ${projectId}, ${userId}, ${oldBudget}, ${newBudget})` as any); } catch (auditErr) { console.error('Audit log insert failed', auditErr); }
      return NextResponse.json({ allocation: updated, delta, newBudget, updated: true }, { status: 200 });
    } else {
      if (delta < 0) return NextResponse.json({ error: 'cannot create allocation with negative delta' }, { status: 400 });
      const [created] = await db.insert(projectManagers).values({ projectId, userId, budget: delta } as any).returning();
      try { await db.execute(sql`INSERT INTO pm_budget_audit (project_manager_id, project_id, user_id, old_budget, new_budget) VALUES (${created.id}, ${projectId}, ${userId}, NULL, ${delta})` as any); } catch (auditErr) { console.error('Audit log insert failed', auditErr); }
      return NextResponse.json({ allocation: created, delta, newBudget: delta, created: true, date: dateStr }, { status: 201 });
    }
  } catch (e: any) {
    console.error('pm-budgets POST error', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
