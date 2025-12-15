
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/drizzle/db';
import { tools, projects, projectManagers, toolMovements } from '@/drizzle/schema';
import { and, eq } from 'drizzle-orm';

// PATCH /api/tools/:toolId  { location?: string, name?: string }
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ toolId: string }> }) {
  const { toolId } = await ctx.params;
  let body;
  try {
    body = await req.json();
  } catch (e) {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const { name, location: projectId, responsiblePmId: responsiblePmIdRaw } = body;
  
  const values: Record<string, any> = {}; // Changed to 'any' to allow null for responsiblePmId
  if (name && typeof name === 'string' && name.trim()) values.name = name.trim();
  if (projectId && typeof projectId === 'string' && projectId.trim()) values.location = projectId.trim();
  
  let pmId: string | null | undefined = undefined; // Initialize as undefined to distinguish from null
  if (typeof responsiblePmIdRaw === 'string') {
    const pm = responsiblePmIdRaw.trim();
    values.responsiblePmId = pm;
    pmId = pm || null;
  } else if (responsiblePmIdRaw === null) {
    // Explicit null clearing
    values.responsiblePmId = null; // Drizzle will handle null correctly
    pmId = null;
  }

  if (Object.keys(values).length === 0) {
    return NextResponse.json({ error: 'لا يوجد بيانات للتعديل' }, { status: 400 });
  }

  // Get current tool state to check against
  const [currentTool] = await db.select().from(tools).where(eq(tools.id, toolId)).limit(1);
  if (!currentTool) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  // Update
  const [updated] = await db
    .update(tools)
    .set({
      ...values,
      ...(projectId !== undefined ? { location: projectId } : {}), // Only update location if projectId was provided
      ...(pmId !== undefined ? { responsiblePmId: pmId } : {}), // Only update responsiblePmId if pmId was provided (or explicitly null)
    })
    .where(eq(tools.id, toolId))
    .returning();

  // Record movement if location or PM changed
  // We compare updated values against currentTool values
  const hasLocationChanged = updated.location !== currentTool.location;
  const hasPmChanged = updated.responsiblePmId !== currentTool.responsiblePmId;

  if (hasLocationChanged || hasPmChanged) {
    await db.insert(toolMovements).values({
      toolId: toolId,
      fromLocation: currentTool.location,
      toLocation: updated.location,
      responsiblePmId: updated.responsiblePmId,
    });
  }

  return NextResponse.json({ tool: updated });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ toolId: string }> }) {
  const { toolId } = await ctx.params;
  const [deleted] = await db.delete(tools).where(eq(tools.id, toolId)).returning({ id: tools.id });
  if (!deleted) return NextResponse.json({ error: 'غير موجود' }, { status: 404 });
  return NextResponse.json({ success: true });
}
