import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/drizzle/db';
import { sql } from 'drizzle-orm';

// GET /api/reports/budgets?projectId=
// Returns per-project totals and per-PM budgets with spending
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId') || undefined;

  // Per-project summary: totalBudget, spent, remaining
  const projectSummary = await db.execute(sql`
    SELECT p.id AS project_id, p.name, p.total_budget,
           COALESCE(SUM(t.amount), 0) AS spent,
           (p.total_budget - COALESCE(SUM(t.amount), 0)) AS remaining
    FROM projects p
    LEFT JOIN transactions t ON t.project_id = p.id
    ${projectId ? sql`WHERE p.id = ${projectId}` : sql``}
    GROUP BY p.id, p.name, p.total_budget
    ORDER BY p.name ASC;
  `);

  // Per-PM budget vs spend within each project
  const perPm = await db.execute(sql`
    SELECT pm.project_id, pm.user_id, u.username,
           pm.budget AS pm_budget,
           COALESCE(SUM(t.amount), 0) AS pm_spent,
           (pm.budget - COALESCE(SUM(t.amount), 0)) AS pm_remaining
    FROM project_managers pm
    JOIN users u ON u.id = pm.user_id
    LEFT JOIN transactions t ON t.user_id = pm.user_id AND t.project_id = pm.project_id
    ${projectId ? sql`WHERE pm.project_id = ${projectId}` : sql``}
    GROUP BY pm.project_id, pm.user_id, u.username, pm.budget
    ORDER BY pm.project_id ASC, u.username ASC;
  `);

  return NextResponse.json({
    scope: { projectId: projectId || null },
    projects: (projectSummary as any).rows ?? [],
    perManager: (perPm as any).rows ?? [],
  });
}
