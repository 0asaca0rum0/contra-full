import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/drizzle/db';
import { projectManagers, users, transactions } from '@/drizzle/schema';
import { sql } from 'drizzle-orm';

export async function GET(_req: NextRequest) {
  try {
  // All PM users (even if they have no project assignments yet) plus admins
  const pmRows = await db.execute(sql`SELECT u.id, u.username, u.role FROM users u WHERE u.role IN ('PM','ADMIN') ORDER BY u.username` as any);
  const pms = (pmRows as any).rows || [];
    if (pms.length === 0) return NextResponse.json({ pms: [] });

    // Allocation (current budget) per PM aggregated across projects
  const allocRows: any = await db.execute(sql`SELECT user_id, COALESCE(SUM(budget),0) AS allocated FROM project_managers GROUP BY user_id` as any);
    const allocMap = new Map<string, number>();
    for (const r of allocRows.rows || []) allocMap.set(r.user_id, Number(r.allocated));

    // Spent per PM (transactions table sums by user_id)
    const spentRows: any = await db.execute(sql`SELECT user_id, COALESCE(SUM(amount),0) AS spent FROM transactions GROUP BY user_id` as any);
    const spentMap = new Map<string, number>();
    for (const r of (spentRows.rows || [])) spentMap.set(r.user_id, Number(r.spent));

    const data = pms.map((pm: any) => {
      const allocated = allocMap.get(pm.id) || 0;
      const spent = spentMap.get(pm.id) || 0;
      const hasAnyAllocation = allocMap.has(pm.id);
      return {
        id: pm.id,
        username: pm.username,
        allocated,
        spent,
        remaining: allocated - spent,
        noProjectsYet: pm.role === 'PM' && !hasAnyAllocation ? true : undefined,
        isAdmin: pm.role === 'ADMIN' ? true : undefined,
      };
    });

    return NextResponse.json({ pms: data });
  } catch (e: any) {
    console.error('PM list overview error', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
