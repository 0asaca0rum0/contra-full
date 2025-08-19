import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/drizzle/db';
import { sql } from 'drizzle-orm';

// GET /api/reports/attendance?projectId=&from=&to=&groupBy=(day|employee)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId') || undefined;
  const groupBy = (searchParams.get('groupBy') || 'day').toLowerCase();
  const now = new Date();
  const defaultFrom = new Date(now);
  defaultFrom.setDate(now.getDate() - 6); // last 7 days inclusive
  const from = searchParams.get('from') ? new Date(searchParams.get('from')!) : defaultFrom;
  const to = searchParams.get('to') ? new Date(searchParams.get('to')!) : now;

  // Normalize to ensure from <= to and add +1 day on "to" to make it exclusive upper bound by day
  const fromDay = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const toDay = new Date(to.getFullYear(), to.getMonth(), to.getDate() + 1);

  if (groupBy === 'employee') {
    // Per-employee totals within range (optionally scoped by project)
    const res = await db.execute(sql`
      SELECT e.id as employee_id, e.name,
             SUM(CASE WHEN a.present THEN 1 ELSE 0 END) AS present_days,
             COUNT(*) AS total_marks
      FROM attendance a
      JOIN employees e ON e.id = a.employee_id
      ${projectId ? sql`WHERE e.project_id = ${projectId} AND` : sql`WHERE`} a.date >= ${fromDay} AND a.date < ${toDay}
      GROUP BY e.id, e.name
      ORDER BY e.name ASC;
    `);
    return NextResponse.json({
      scope: { projectId: projectId || null, from: fromDay.toISOString(), to: toDay.toISOString() },
      groupBy: 'employee',
      rows: (res as any).rows ?? [],
    });
  }

  // Default: group by day
  const res = await db.execute(sql`
    SELECT DATE_TRUNC('day', a.date) AS day,
           SUM(CASE WHEN a.present THEN 1 ELSE 0 END) AS present,
           COUNT(*) AS total
    FROM attendance a
    ${projectId ? sql`JOIN employees e ON e.id = a.employee_id` : sql``}
    WHERE ${projectId ? sql`e.project_id = ${projectId} AND` : sql``} a.date >= ${fromDay} AND a.date < ${toDay}
    GROUP BY DATE_TRUNC('day', a.date)
    ORDER BY day ASC;
  `);
  return NextResponse.json({
    scope: { projectId: projectId || null, from: fromDay.toISOString(), to: toDay.toISOString() },
    groupBy: 'day',
    rows: (res as any).rows ?? [],
  });
}
