import { NextResponse } from 'next/server';
import { db } from '@/drizzle/db';
import { suppliers } from '@/drizzle/schema';
import { sql } from 'drizzle-orm';

// GET /api/suppliers/overview - aggregated supplier stats similar to PM overview
export async function GET() {
  try {
    const allSuppliers = await db.select().from(suppliers);

    const agg = await db.execute(sql`
      SELECT supplier_id, 
             SUM(amount)::double precision AS spent,
             COUNT(*) AS tx_count,
             MAX(created_at) AS last_tx
      FROM transactions
      WHERE supplier_id IS NOT NULL
      GROUP BY supplier_id
    `);

    // drizzle raw execute returns { rows }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = (agg as any).rows || [];
    const byId: Record<string, any> = {};
    rows.forEach((r: any) => { byId[r.supplier_id] = r; });

    const result = allSuppliers.map(s => {
      const a = byId[s.id] || {};
      return {
        id: s.id,
        name: s.name,
        balance: s.balance,
        spent: Number(a.spent || 0),
        transactionsCount: Number(a.tx_count || 0),
        lastTransaction: a.last_tx || null,
      };
    });

    return NextResponse.json({ suppliers: result });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
