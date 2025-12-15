
import { NextRequest } from 'next/server';
import { db } from '@/drizzle/db';
import { warehouseTransactions, warehouseItems, projects, users } from '@/drizzle/schema';
import { desc, eq } from 'drizzle-orm';
import { apiSuccess, apiError } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get('limit') || '50');

    const history = await db
      .select({
        id: warehouseTransactions.id,
        quantity: warehouseTransactions.quantity,
        createdAt: warehouseTransactions.createdAt,
        itemName: warehouseItems.name,
        projectName: projects.name,
        userName: users.username,
        // We could also join 'price' if we wanted to calculate value at this moment
      })
      .from(warehouseTransactions)
      .leftJoin(warehouseItems, eq(warehouseTransactions.itemId, warehouseItems.id))
      .leftJoin(projects, eq(warehouseTransactions.projectId, projects.id))
      .leftJoin(users, eq(warehouseTransactions.userId, users.id))
      .orderBy(desc(warehouseTransactions.createdAt))
      .limit(limit);

    return apiSuccess(req, { history });
  } catch (error: any) {
    return apiError(req, 'history_fetch_failed', 'فشل جلب سجل الحركات', 500);
  }
}
