import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/drizzle/db';
import { projectManagers, projects, users, transactions, pmBudgetAudit } from '@/drizzle/schema';
import { eq, sql } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const segments = req.nextUrl.pathname.split('/');
  const userIdx = segments.indexOf('pm') + 1;
  const userId = segments[userIdx];
  try {
    const rows = await db.select({
      pmId: projectManagers.id,
      projectId: projectManagers.projectId,
      userId: projectManagers.userId,
      currentBudget: projectManagers.budget,
      projectName: projects.name,
      totalProjectBudget: projects.totalBudget,
      username: users.username,
    }).from(projectManagers)
      .innerJoin(projects, eq(projectManagers.projectId, projects.id))
      .innerJoin(users, eq(projectManagers.userId, users.id))
      .where(eq(projectManagers.userId, userId));

    const projectIds = Array.from(new Set(rows.map(r => r.projectId)));

    let spentMap = new Map<string, number>();
    let expenseRows: any[] = [];
    if (projectIds.length) {
      const spentRows: any = await db.execute(sql`SELECT project_id, COALESCE(SUM(amount),0) AS spent FROM transactions WHERE project_id IN (${sql.join(projectIds, sql`,`)}) GROUP BY project_id` as any);
      for (const r of (spentRows.rows || [])) spentMap.set(r.project_id, Number(r.spent));
      // Recent expenses per project for this PM (limit overall to avoid bloat)
      const expensesRes: any = await db.execute(sql`
        SELECT id, project_id, amount, description, receipt_url, created_at
        FROM transactions
        WHERE user_id = ${userId} AND project_id IN (${sql.join(projectIds, sql`,`)})
        ORDER BY created_at DESC
        LIMIT 150
      ` as any);
      expenseRows = expensesRes.rows || [];
    }

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
    } catch {}

    let history: any[] = [];
    try {
      history = await db.select({
        id: pmBudgetAudit.id,
        projectManagerId: pmBudgetAudit.projectManagerId,
        projectId: pmBudgetAudit.projectId,
        oldBudget: pmBudgetAudit.oldBudget,
        newBudget: pmBudgetAudit.newBudget,
        changedAt: pmBudgetAudit.changeDate,
      }).from(pmBudgetAudit).where(eq(pmBudgetAudit.userId, userId)).orderBy(pmBudgetAudit.changeDate as any);
    } catch {}

    const historyByProject: Record<string, any[]> = {};
    for (const h of history) {
      const delta = h.oldBudget == null ? h.newBudget : (h.newBudget - h.oldBudget);
      const entry = { ...h, delta };
      (historyByProject[h.projectId] ||= []).push(entry);
    }

    // Group expenses by project (cap each project to top 15 after overall limit)
    const expensesByProject = new Map<string, any[]>();
    for (const ex of expenseRows) {
      const arr = expensesByProject.get(ex.project_id) || [];
      if (arr.length < 15) arr.push({
        id: ex.id,
        amount: Number(ex.amount),
        description: ex.description,
        receiptUrl: ex.receipt_url,
        createdAt: ex.created_at,
      });
      expensesByProject.set(ex.project_id, arr);
    }

    const projectsData = rows.map(r => ({
      projectId: r.projectId,
      projectName: r.projectName,
      totalProjectBudget: r.totalProjectBudget,
      currentBudget: r.currentBudget,
      projectSpent: spentMap.get(r.projectId) || 0,
      history: historyByProject[r.projectId] || [],
      expenses: expensesByProject.get(r.projectId) || [],
    }));

    const username = rows[0]?.username;
    return NextResponse.json({ userId, username, projects: projectsData });
  } catch (e: any) {
    console.error('PM overview error', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
