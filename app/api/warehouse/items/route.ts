import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../drizzle/db';
import { warehouseItems } from '../../../../drizzle/schema';
import { ilike } from 'drizzle-orm';

// GET /api/warehouse/items (all roles with permission)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  const rows = q
    ? await db.select().from(warehouseItems).where(ilike(warehouseItems.name, `%${q}%`))
    : await db.select().from(warehouseItems);
  return NextResponse.json({ items: rows });
}

// POST /api/warehouse/items (Admin/Mod)
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as any;
  const name = body?.name as string | undefined;
  const quantity = Number(body?.quantity ?? 0);
  const imageUrl = typeof body?.imageUrl === 'string' ? body.imageUrl : null;
  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });
  const [created] = await db.insert(warehouseItems).values({ name, quantity: Number.isFinite(quantity) ? quantity : 0, imageUrl: imageUrl ?? undefined }).returning();
  return NextResponse.json({ item: created }, { status: 201 });
}
