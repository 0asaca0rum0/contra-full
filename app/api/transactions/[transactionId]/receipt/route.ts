import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../../drizzle/db';
import { transactions } from '../../../../../drizzle/schema';
import { eq } from 'drizzle-orm';

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

  // For now, accept a receiptUrl string and save it. Actual file handling can be wired later.
  const body = (await req.json().catch(() => null)) as any;
  const receiptUrl = typeof body?.receiptUrl === 'string' ? body.receiptUrl : null;
  if (!receiptUrl) return NextResponse.json({ error: 'receiptUrl is required' }, { status: 400 });

  const [updated] = await db
    .update(transactions)
    .set({ receiptUrl })
    .where(eq(transactions.id, transactionId))
    .returning();
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ transaction: updated });
}
