import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/drizzle/db';
import { suppliers } from '@/drizzle/schema';
import { sql, eq } from 'drizzle-orm';

function extractSupplierId(path: string) { const parts = path.split('/'); const idx = parts.indexOf('suppliers'); return idx>=0 ? parts[idx+1] : undefined; }

// GET /api/suppliers/:supplierId/overview
export async function GET(req: NextRequest) {
  try {
  const supplierId = extractSupplierId(req.nextUrl.pathname);
    console.log('[SUPPLIER_OVERVIEW_API] start', { supplierId });
    if (!supplierId) return NextResponse.json({ error: 'Missing supplierId' }, { status: 400 });

    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, supplierId));
    if (!supplier) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const agg = await db.execute(sql`
      SELECT COALESCE(SUM(amount),0)::double precision AS spent,
             COUNT(*) AS tx_count,
             MAX(created_at) AS last_tx
      FROM transactions
      WHERE supplier_id = ${supplierId}
    `);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row = (agg as any).rows?.[0] || {};

    const tx = await db.execute(sql`
      SELECT id, amount, description, created_at, project_id, user_id
      FROM transactions
      WHERE supplier_id = ${supplierId}
      ORDER BY created_at DESC
      LIMIT 200
    `);

    return NextResponse.json({
      supplier: {
        id: supplier.id,
        name: supplier.name,
        balance: supplier.balance,
        spent: Number(row.spent || 0),
        transactionsCount: Number(row.tx_count || 0),
        lastTransaction: row.last_tx || null,
        transactions: (tx as any).rows || [],
      }
    });
  } catch (e: any) {
    console.error('[SUPPLIER_OVERVIEW_API_ERROR]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
