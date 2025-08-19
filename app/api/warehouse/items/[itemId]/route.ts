import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../../drizzle/db';
import { warehouseItems } from '../../../../../drizzle/schema';
import { eq } from 'drizzle-orm';

function extractItemId(pathname: string): string | null {
  const parts = pathname.split('/').filter(Boolean); // api, warehouse, items, :itemId
  const idx = parts.indexOf('items');
  if (idx === -1 || idx + 1 >= parts.length) return null;
  const candidate = parts[idx + 1];
  if (!candidate) return null;
  return candidate;
}

// PUT /api/warehouse/items/:itemId (Admin/Mod)
export async function PUT(req: NextRequest) {
  const itemId = extractItemId(req.nextUrl.pathname);
  if (!itemId) return NextResponse.json({ error: 'invalid_item_id' }, { status: 400 });
  const body = (await req.json().catch(() => null)) as any;
  const updates: Partial<{ name: string; quantity: number; imageUrl: string | null }> = {};
  if (typeof body?.name === 'string') updates.name = body.name;
  if (typeof body?.quantity !== 'undefined') {
    const n = Number(body.quantity);
    if (!Number.isFinite(n)) return NextResponse.json({ error: 'quantity must be a number' }, { status: 400 });
    updates.quantity = n;
  }
  if (typeof body?.imageUrl !== 'undefined') updates.imageUrl = body.imageUrl === null ? null : String(body.imageUrl);
  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'No valid fields' }, { status: 400 });
  const [updated] = await db
    .update(warehouseItems)
    .set(updates as any)
    .where(eq(warehouseItems.id, itemId))
    .returning();
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ item: updated });
}
