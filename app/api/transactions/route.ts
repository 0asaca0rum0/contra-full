import { NextRequest } from 'next/server';
import { db } from '../../../drizzle/db';
import { transactions } from '../../../drizzle/schema';
import { loadAuthContext, hasRequired } from '@/lib/authz';
import { eq, desc } from 'drizzle-orm';
import { normalizeReceiptStorage, normalizeReceiptUrl } from '@/lib/receipts';
import { z } from 'zod';
import { apiSuccess, apiError, handleZod, parseQueryInt, logger } from '@/lib/api';

// GET /api/transactions (Admin/Mod: all, PM: only their own)
export async function GET(req: NextRequest) {
  const auth = await loadAuthContext();
  if (!auth.userId) return apiError(req, 'unauthorized', 'غير مصرح', 401);
  if (!hasRequired(auth.permissions, { anyOf: ['ALL','EXPENSE_CREATE','PROJECTS_READ'] })) return apiError(req, 'forbidden', 'ممنوع', 403);
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const projectId = searchParams.get('projectId');
  const limit = parseQueryInt(req, 'limit', 100, 500);
  const offset = parseQueryInt(req, 'offset', 0, 100_000);
  try {
    let rows;
    if (userId) {
      rows = await db.select().from(transactions).where(eq(transactions.userId, userId)).orderBy(desc(transactions.createdAt)).limit(limit).offset(offset);
    } else if (projectId) {
      rows = await db.select().from(transactions).where(eq(transactions.projectId, projectId)).orderBy(desc(transactions.createdAt)).limit(limit).offset(offset);
    } else {
      rows = await db.select().from(transactions).orderBy(desc(transactions.createdAt)).limit(limit).offset(offset);
    }
    const fullUrlRows = rows.map(r => ({
      ...r,
      receiptUrl: normalizeReceiptUrl(r.receiptUrl)
    }));
    logger.info({ count: fullUrlRows.length, limit, offset, withReceipts: fullUrlRows.filter(r => r.receiptUrl).length }, 'transactions_list');
    return apiSuccess(req, { transactions: fullUrlRows, paging: { limit, offset, count: rows.length } });
  } catch (e: any) {
    logger.error({ err: e?.message }, 'transactions_get_failed');
    return apiError(req, 'fetch_failed', 'فشل جلب البيانات', 500);
  }
}

// POST /api/transactions (PM)
const TxCreateSchema = z.object({
  amount: z.number({ invalid_type_error: 'يجب أن يكون رقم' }).positive('يجب أن يكون أكبر من صفر'),
  description: z.string().min(1, 'الوصف مطلوب'),
  projectId: z.string().min(1, 'المشروع مطلوب'),
  supplierId: z.string().optional().nullable(),
  date: z.string().optional(),
  receiptKey: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const auth = await loadAuthContext();
  if (!auth.userId) return apiError(req, 'unauthorized', 'غير مصرح', 401);
  if (!hasRequired(auth.permissions, { anyOf: ['ALL','EXPENSE_CREATE'] })) return apiError(req, 'forbidden', 'ممنوع', 403);
  let parsed: any;
  try { parsed = TxCreateSchema.parse(await req.json()); } catch (e) { return handleZod(req, e); }
  const { amount, description, projectId, supplierId, date, receiptKey } = parsed;
  const userId = auth.userId; // لا نسمح بتمرير userId يدوياً
  const values: any = { amount, description, projectId, userId, supplierId: supplierId ?? undefined };
  if (receiptKey) values.receiptUrl = normalizeReceiptStorage(receiptKey);
  if (date) {
    const d = new Date(date);
    if (!isNaN(d.getTime())) values.createdAt = d;
  }
  try {
  const [created] = await db.insert(transactions).values(values).returning();
  logger.info({ id: created.id, amount }, 'transaction_created');
  return apiSuccess(req, { transaction: { ...created, receiptUrl: normalizeReceiptUrl(created.receiptUrl) } });
  } catch (e: any) {
    logger.error({ err: e?.message }, 'transaction_create_failed');
    return apiError(req, 'insert_failed', 'فشل إنشاء المعاملة', 500);
  }
}

