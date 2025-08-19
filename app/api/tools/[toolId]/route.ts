import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/drizzle/db';
import { tools } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

// PATCH /api/tools/:toolId  { location?: string, name?: string }
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ toolId: string }> }) {
  const { toolId } = await ctx.params;
  const body = await req.json().catch(() => null) as any;
  const locationRaw = body?.location;
  const nameRaw = body?.name;
  const values: any = {};
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
  if (Object.keys(values).length === 0) {
    return NextResponse.json({ error: 'لا يوجد بيانات للتعديل' }, { status: 400 });
  }
  const [updated] = await db.update(tools).set(values).where(eq(tools.id, toolId)).returning();
  if (!updated) return NextResponse.json({ error: 'غير موجود' }, { status: 404 });
  return NextResponse.json({ tool: updated });
}
