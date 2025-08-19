import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../../../drizzle/db';
import { warehouseTransactions } from '../../../../../../drizzle/schema';
import { eq } from 'drizzle-orm';

function extractItemId(pathname: string): string | null {
  const parts = pathname.split('/').filter(Boolean); // api, warehouse, items, :itemId, history
  const idx = parts.indexOf('items');
  if (idx === -1 || idx + 1 >= parts.length) return null;
  const candidate = parts[idx + 1];
  if (!candidate || candidate === 'history') return null;
  return candidate;
}

// GET /api/warehouse/items/:itemId/history (Admin/Mod)
export async function GET(req: NextRequest) {
  const itemId = extractItemId(req.nextUrl.pathname);
  if (!itemId) return NextResponse.json({ error: 'invalid_item_id' }, { status: 400 });
  const rows = await db.select().from(warehouseTransactions).where(eq(warehouseTransactions.itemId, itemId));
  return NextResponse.json({ history: rows });
}
