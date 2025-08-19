import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../../drizzle/db';
import { sql } from 'drizzle-orm';

// GET /api/pm/attendance/today (PM)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId'); // since no JWT
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const rows = await db.execute(sql`
    SELECT a.*
    FROM attendance a
    JOIN employees e ON e.id = a.employee_id
    JOIN project_managers pm ON pm.project_id = e.project_id
    WHERE pm.user_id = ${userId} AND a.date >= ${start} AND a.date < ${end}
    ORDER BY a.date DESC
  `);
  return NextResponse.json({ attendance: (rows as any).rows ?? [] });
}
