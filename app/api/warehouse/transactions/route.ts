import { NextRequest } from 'next/server';
import { db } from '../../../../drizzle/db';
import { warehouseTransactions, warehouseItems, suppliers } from '../../../../drizzle/schema';
import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { apiSuccess, apiError, handleZod, logger } from '@/lib/api';

const TxSchema = z.object({
  itemId: z.string().min(1, 'مطلوب'),
  projectId: z.string().min(1, 'مطلوب'),
  userId: z.string().min(1, 'مطلوب'),
  quantity: z.number({ invalid_type_error: 'يجب أن يكون رقم' }).int('عدد صحيح').refine(v => v !== 0, 'لا يمكن أن يكون صفر').refine(v => Math.abs(v) <= 100000, 'قيمة كبيرة جداً'),
  supplierId: z.string().optional().nullable(),
  type: z.enum(['IN','OUT']).default('OUT'), // OUT تستهلك المخزون، IN تضيف للمخزون
});

// POST /api/warehouse/transactions (PM)
export async function POST(req: NextRequest) {
  let parsed: z.infer<typeof TxSchema>;
  try {
    const json = await req.json();
    parsed = TxSchema.parse(json);
  } catch (e) {
    return handleZod(req, e);
  }
  const { itemId, projectId, userId, quantity: qtyRaw, supplierId, type } = parsed;
  const quantity: number = qtyRaw as number;

  // Fetch current stock
  const itemRows = await db.select({ id: warehouseItems.id, quantity: warehouseItems.quantity }).from(warehouseItems).where(eq(warehouseItems.id, itemId as any));
  const currentQty = Number(itemRows[0]?.quantity ?? 0);
  if (!itemRows[0]) return apiError(req, 'item_not_found', 'العنصر غير موجود', 404);

  const delta: number = type === 'OUT' ? -Math.abs(quantity) : Math.abs(quantity);
  if (type === 'OUT' && currentQty + delta < 0) {
    return apiError(req, 'insufficient_stock', 'الكمية غير متوفرة في المخزون', 400, { available: currentQty, attempted: quantity });
  }

  try {
  const [tx] = await db.insert(warehouseTransactions).values({ itemId, projectId, userId, quantity: delta } as any).returning();
  await db.update(warehouseItems).set({ quantity: sql`${warehouseItems.quantity} + ${delta}` }).where(eq(warehouseItems.id, itemId as any));
    // Update supplier balance if provided
    if (supplierId) {
      // OUT => نشتري (نزيد ما ندين به) ، IN => ربما إرجاع (نقلل ما ندين به)
  const supplierDelta: number = type === 'OUT' ? Math.abs(quantity) : -Math.abs(quantity);
  await db.update(suppliers).set({ balance: sql`${suppliers.balance} + ${supplierDelta}` }).where(eq(suppliers.id, supplierId as any));
    }
    logger.info({ itemId, projectId, userId, delta, requestId: req.headers.get('x-request-id') }, 'warehouse_tx_created');
    return apiSuccess(req, { transaction: tx });
  } catch (e: any) {
    logger.error({ err: e?.message }, 'warehouse_tx_failed');
    return apiError(req, 'warehouse_tx_failed', 'فشل إنشاء معاملة المخزون', 500);
  }
}
