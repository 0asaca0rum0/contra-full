import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/drizzle/db';
import { employees } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

// POST /api/employees (Admin/Mod with permission)
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as any;
  const name = body?.name as string | undefined;
  const projectId = body?.projectId as string | undefined;
  if (!name || !projectId) return NextResponse.json({ error: 'name and projectId are required' }, { status: 400 });
  const [created] = await db.insert(employees).values({ name, projectId }).returning();
  return NextResponse.json({ employee: created }, { status: 201 });
}

// GET /api/employees?projectId=... (Admin/Mod/PM)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId');
  const rows = projectId
    ? await db.select().from(employees).where(eq(employees.projectId, projectId))
    : await db.select().from(employees);
  return NextResponse.json({ employees: rows });
}

// PATCH /api/employees?id=... body: { name? }
export async function PATCH(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const body = await req.json().catch(() => null) as any;
  const name = body?.name as string | undefined;
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 });
  const [updated] = await db.update(employees).set({ name }).where(eq(employees.id, id)).returning();
  if (!updated) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json({ employee: updated });
}

// DELETE /api/employees?id=...
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const [deleted] = await db.delete(employees).where(eq(employees.id, id)).returning();
  if (!deleted) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}
