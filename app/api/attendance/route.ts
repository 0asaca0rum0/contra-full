import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/drizzle/db';
import { attendance, employees, users } from '@/drizzle/schema';
import { loadAuthContext, hasRequired } from '@/lib/authz';
import { eq, and, gte, lt, sql } from 'drizzle-orm';

// POST /api/attendance (PM)
export async function POST(req: NextRequest) {
  const auth = await loadAuthContext();
  if (!auth.userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!hasRequired(auth.permissions, { anyOf: ['ALL','ATTENDANCE_MARK'] })) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const body = await req.json().catch(() => null) as any;
  const employeeId = body?.employeeId as string | undefined;
  const present = Boolean(body?.present);
  // Derive user from auth cookie (uid) if present
  let markedById = body?.markedById as string | undefined;
  try {
    const ck = await cookies();
    const uid = ck.get('uid')?.value;
    if (uid) markedById = uid;
  } catch {}
  if (!employeeId) return NextResponse.json({ error: 'employeeId required' }, { status: 400 });
  if (!markedById) return NextResponse.json({ error: 'unauthenticated (no user id)' }, { status: 401 });
  // Validate user exists to avoid FK violation
  const userExists = await db.select({ id: users.id }).from(users).where(eq(users.id, markedById)).limit(1);
  if (!userExists[0]) return NextResponse.json({ error: 'invalid user' }, { status: 401 });

  // Use current date (truncate to day)
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  // Upsert by unique (employeeId, date). Our schema has date as full timestamp; emulate day-uniq.
  const existing = await db
    .select({ id: attendance.id })
    .from(attendance)
    .where(and(eq(attendance.employeeId, employeeId), gte(attendance.date, start), lt(attendance.date, end)))
    .limit(1);
  if (existing[0]) {
    const [updated] = await db
      .update(attendance)
      .set({ present, markedById })
      .where(eq(attendance.id, existing[0].id))
      .returning();
    return NextResponse.json({ attendance: updated });
  }
  const [created] = await db.insert(attendance).values({ employeeId, present, markedById }).returning();
  return NextResponse.json({ attendance: created }, { status: 201 });
}

// GET /api/attendance?projectId=...&date=... (Admin/Mod/PM)
export async function GET(req: NextRequest) {
  const auth = await loadAuthContext();
  if (!auth.userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!hasRequired(auth.permissions, { anyOf: ['ALL','ATTENDANCE_READ','ATTENDANCE_MARK'] })) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId');
  const dateStr = searchParams.get('date');
  const day = dateStr ? new Date(dateStr) : new Date();
  const start = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  const end = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1);

  // Filter by project if provided by joining employees
  if (projectId) {
    const res = await db.execute(sql`
      SELECT a.id, a.date, a.present, a.employee_id, a.marked_by_id
      FROM attendance a
      JOIN employees e ON e.id = a.employee_id
      WHERE e.project_id = ${projectId} AND a.date >= ${start} AND a.date < ${end}
      ORDER BY a.date DESC
    `);
    return NextResponse.json({ attendance: (res as any).rows ?? [] });
  }
  const rows = await db
    .select()
    .from(attendance)
    .where(and(gte(attendance.date, start), lt(attendance.date, end)));
  return NextResponse.json({ attendance: rows });
}
