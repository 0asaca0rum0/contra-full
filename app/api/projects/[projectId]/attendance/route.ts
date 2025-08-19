import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/drizzle/db';
import { sql } from 'drizzle-orm';

// GET /api/projects/:projectId/attendance (Admin/Mod/PM)
export async function GET(req: NextRequest, ctx: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await ctx.params;
  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get('date');
  const day = dateStr ? new Date(dateStr) : new Date();
  const start = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  const end = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1);
  const rows = await db.execute(sql`
    SELECT a.*
    FROM attendance a
    JOIN employees e ON e.id = a.employee_id
    WHERE e.project_id = ${projectId} AND a.date >= ${start} AND a.date < ${end}
    ORDER BY a.date DESC
  `);
  return NextResponse.json({ attendance: (rows as any).rows ?? [] });
}
