import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/drizzle/db';
import { sql } from 'drizzle-orm';

// GET /api/reports/warehouse?projectId=&days=30
// Returns item stock levels and movement counts within a time window
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId') || undefined;
  const days = Number(searchParams.get('days') || 30);
  const now = new Date();
  const since = new Date(now);
  since.setDate(now.getDate() - Math.max(1, days));

  // Current stock per item
  const stock = await db.execute(sql`
    SELECT i.id AS item_id, i.name, i.quantity
    FROM warehouse_items i
    ORDER BY i.name ASC;
  `);

  // Movement summary per item within window, optionally filtered by project
  const moves = await db.execute(sql`
    SELECT wt.item_id,
           SUM(CASE WHEN wt.quantity < 0 THEN -wt.quantity ELSE 0 END) AS checked_out,
           SUM(CASE WHEN wt.quantity > 0 THEN wt.quantity ELSE 0 END) AS returned
    FROM warehouse_transactions wt
    ${projectId ? sql`WHERE wt.project_id = ${projectId} AND` : sql`WHERE`} wt.created_at >= ${since}
    GROUP BY wt.item_id
    ORDER BY wt.item_id ASC;
  `);

  return NextResponse.json({
    scope: { projectId: projectId || null, since: since.toISOString() },
    stock: (stock as any).rows ?? [],
    movement: (moves as any).rows ?? [],
  });
}
