import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../drizzle/db';
import { suppliers } from '../../../../drizzle/schema';
import { eq } from 'drizzle-orm';

/**
 * Helper function to check if supplier exists
 */
async function getSupplier(supplierId: string) {
  const [supplier] = await db
    .select()
    .from(suppliers)
    .where(eq(suppliers.id, supplierId))
    .limit(1);
  return supplier;
}

// GET /api/suppliers/:supplierId - Get supplier details
export async function GET(_req: NextRequest, ctx: { params: Promise<{ supplierId: string }> }) {
  const { supplierId } = await ctx.params;
  const supplier = await getSupplier(supplierId);

  if (!supplier) {
    return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
  }

  return NextResponse.json({ supplier });
}

// PUT /api/suppliers/:supplierId - Update supplier (Admin/Mod)
export async function PUT(req: NextRequest, ctx: { params: Promise<{ supplierId: string }> }) {
  const { supplierId } = await ctx.params;

  // Check if supplier exists
  const existing = await getSupplier(supplierId);
  if (!existing) {
    return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
  }

  // Parse and validate request body
  const body = await req.json().catch(() => null) as any;
  if (!body) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  // Build updates object
  const updates: Partial<{ name: string; balance: number }> = {};

  if (typeof body.name === 'string' && body.name.trim()) {
    updates.name = body.name.trim();
  }

  if (body.balance !== undefined) {
    const balance = Number(body.balance);
    if (!Number.isFinite(balance)) {
      return NextResponse.json({ error: 'balance must be a valid number' }, { status: 400 });
    }
    updates.balance = balance;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  // Update supplier
  const [updated] = await db
    .update(suppliers)
    .set(updates as any)
    .where(eq(suppliers.id, supplierId))
    .returning();

  return NextResponse.json({ supplier: updated });
}

// DELETE /api/suppliers/:supplierId - Delete supplier (Admin/Mod)
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ supplierId: string }> }) {
  const { supplierId } = await ctx.params;

  // Check if supplier exists
  const existing = await getSupplier(supplierId);
  if (!existing) {
    return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
  }

  // Delete supplier
  await db.delete(suppliers).where(eq(suppliers.id, supplierId));

  return NextResponse.json({ success: true, message: 'Supplier deleted successfully' });
}
