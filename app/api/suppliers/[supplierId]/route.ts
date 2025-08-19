import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../drizzle/db';
import { suppliers } from '../../../../drizzle/schema';
import { eq } from 'drizzle-orm';

// PUT /api/suppliers/:supplierId (Admin/Mod)
export async function PUT(req: NextRequest, ctx: { params: Promise<{ supplierId: string }> }) {
  const { supplierId } = await ctx.params;
  const body = await req.json().catch(() => null) as any;
  const updates: Partial<{ name: string; balance: number }> = {};
  if (typeof body?.name === 'string') updates.name = body.name;
  if (typeof body?.balance !== 'undefined') {
    const n = Number(body.balance);
    if (!Number.isFinite(n)) return NextResponse.json({ error: 'balance must be a number' }, { status: 400 });
    updates.balance = n;
  }
  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'No valid fields' }, { status: 400 });
  const [updated] = await db.update(suppliers).set(updates as any).where(eq(suppliers.id, supplierId)).returning();
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ supplier: updated });
}

// DELETE /api/suppliers/:supplierId (Admin/Mod)
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ supplierId: string }> }) {
  const { supplierId } = await ctx.params;
  const [deleted] = await db.delete(suppliers).where(eq(suppliers.id, supplierId)).returning({ id: suppliers.id });
  if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}
