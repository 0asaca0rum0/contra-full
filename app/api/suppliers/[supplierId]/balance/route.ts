import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../../drizzle/db';
import { suppliers } from '../../../../../drizzle/schema';
import { eq, sql } from 'drizzle-orm';

// PATCH /api/suppliers/:supplierId/balance (Admin/Mod)
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ supplierId: string }> }) {
  const { supplierId } = await ctx.params;
  const body = await req.json().catch(() => null) as any;
  const delta = Number(body?.delta);
  if (!Number.isFinite(delta)) return NextResponse.json({ error: 'delta is required number' }, { status: 400 });
  const [updated] = await db
    .update(suppliers)
    .set({ balance: sql`${suppliers.balance} + ${delta}` })
    .where(eq(suppliers.id, supplierId))
    .returning();
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ supplier: updated });
}
