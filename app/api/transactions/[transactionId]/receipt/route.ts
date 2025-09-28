import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../../drizzle/db';
import { transactions } from '../../../../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { normalizeReceiptStorage, normalizeReceiptUrl } from '@/lib/receipts';

type ReceiptPayload = {
  receiptKey?: string;
  receiptUrl?: string;
};

// Helper to extract the dynamic transactionId segment from the pathname
function extractTransactionId(pathname: string): string | null {
  // Expect pattern: /api/transactions/:transactionId/receipt
  const parts = pathname.split('/').filter(Boolean);
  const idx = parts.indexOf('transactions');
  if (idx === -1 || idx + 1 >= parts.length) return null;
  return parts[idx + 1] === 'receipt' ? null : parts[idx + 1];
}

// POST /api/transactions/:transactionId/receipt (PM)
export async function POST(req: NextRequest) {
  const transactionId = extractTransactionId(req.nextUrl.pathname);
  if (!transactionId) return NextResponse.json({ error: 'Invalid transaction id' }, { status: 400 });

  // Accept either a raw receipt key or a previously generated URL and normalize to stored key.
  const body = (await req.json().catch(() => null)) as ReceiptPayload | null;
  const raw = typeof body?.receiptKey === 'string' ? body.receiptKey : typeof body?.receiptUrl === 'string' ? body.receiptUrl : null;
  if (!raw) return NextResponse.json({ error: 'receiptKey is required' }, { status: 400 });

  const receiptKey = normalizeReceiptStorage(raw);

  const [updated] = await db
    .update(transactions)
    .set({ receiptUrl: receiptKey })
    .where(eq(transactions.id, transactionId))
    .returning();
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const normalized = normalizeReceiptUrl(updated.receiptUrl);
  console.log('[TransactionReceiptAPI] updated receipt', {
    transactionId,
    hasReceipt: Boolean(normalized)
  });
  return NextResponse.json({ transaction: { ...updated, receiptUrl: normalized } });
}
