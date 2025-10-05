import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/drizzle/db';
import { tools, projects, projectManagers } from '@/drizzle/schema';
import { and, eq } from 'drizzle-orm';

// PATCH /api/tools/:toolId  { location?: string, name?: string }
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ toolId: string }> }) {
  const { toolId } = await ctx.params;
  const body = await req.json().catch(() => null) as any;
  const locationRaw = body?.location;
  const nameRaw = body?.name;
  const responsiblePmIdRaw = body?.responsiblePmId;
  const values: Record<string, string> = {};
  if (typeof locationRaw === 'string') {
    const loc = locationRaw.trim();
    if (!loc) return NextResponse.json({ error: 'الموقع مطلوب' }, { status: 400 });
    if (loc.length > 120) return NextResponse.json({ error: 'الموقع طويل جداً' }, { status: 400 });
    values.location = loc;
  }
  if (typeof nameRaw === 'string') {
    const nm = nameRaw.trim();
    if (!nm) return NextResponse.json({ error: 'الاسم مطلوب' }, { status: 400 });
    if (nm.length > 120) return NextResponse.json({ error: 'الاسم طويل جداً' }, { status: 400 });
    values.name = nm;
  }
  if (typeof responsiblePmIdRaw === 'string') {
    const pm = responsiblePmIdRaw.trim();
    if (!pm) return NextResponse.json({ error: 'يجب اختيار مدير مشروع مسؤول' }, { status: 400 });
    values.responsiblePmId = pm;
  }
  if (Object.keys(values).length === 0) {
    return NextResponse.json({ error: 'لا يوجد بيانات للتعديل' }, { status: 400 });
  }
  const existingRows = await db.select().from(tools).where(eq(tools.id, toolId)).limit(1);
  const current = existingRows.at(0);
  if (!current) return NextResponse.json({ error: 'غير موجود' }, { status: 404 });
  const projectId = values.location ?? current.location;
  const pmId = values.responsiblePmId ?? current.responsiblePmId;

  const projectExists = await db.select({ id: projects.id }).from(projects).where(eq(projects.id, projectId)).limit(1);
  if (projectExists.length === 0) {
    return NextResponse.json({ error: 'المشروع غير موجود' }, { status: 404 });
  }
  if (pmId) {
    const pmAssignment = await db
      .select({ ok: projectManagers.userId })
      .from(projectManagers)
      .where(and(eq(projectManagers.projectId, projectId), eq(projectManagers.userId, pmId)))
      .limit(1);
    if (pmAssignment.length === 0) {
      return NextResponse.json({ error: 'مدير المشروع المحدد غير مرتبط بالمشروع' }, { status: 400 });
    }
  }

  const [updated] = await db
    .update(tools)
    .set({
      ...values,
      location: projectId,
      responsiblePmId: pmId ?? null,
    })
    .where(eq(tools.id, toolId))
    .returning();
  return NextResponse.json({ tool: updated });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ toolId: string }> }) {
  const { toolId } = await ctx.params;
  const [deleted] = await db.delete(tools).where(eq(tools.id, toolId)).returning({ id: tools.id });
  if (!deleted) return NextResponse.json({ error: 'غير موجود' }, { status: 404 });
  return NextResponse.json({ success: true });
}
