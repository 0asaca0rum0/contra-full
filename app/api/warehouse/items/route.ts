import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../drizzle/db';
import { warehouseItems } from '../../../../drizzle/schema';
import { ilike, desc } from 'drizzle-orm';
import { z } from 'zod';
import { apiSuccess, handleZod } from '@/lib/api';

// GET /api/warehouse/items (all roles with permission)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  const rows = q
    ? await db.select().from(warehouseItems).where(ilike(warehouseItems.name, `%${q}%`)).orderBy(desc(warehouseItems.createdAt))
    : await db.select().from(warehouseItems).orderBy(desc(warehouseItems.createdAt));
  return apiSuccess(req, { items: rows });
}

const ItemSchema = z.object({
  name: z.string().min(1, 'مطلوب'),
  quantity: z.number({ invalid_type_error: 'رقم' }).int().nonnegative(),
  imageUrl: z.string().optional(),
  price: z.number().optional().default(0),
});

// POST /api/warehouse/items (Admin/Mod)
export async function POST(req: NextRequest) {
  let parsed: z.infer<typeof ItemSchema>;
  try {
    parsed = ItemSchema.parse(await req.json());
  } catch (e) {
    return handleZod(req, e);
  }
  const { name, quantity, imageUrl, price } = parsed;

  const [created] = await db.insert(warehouseItems).values({ name, quantity, imageUrl, price } as any).returning();
  return apiSuccess(req, { item: created }, { status: 201 });
}
