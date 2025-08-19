import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/drizzle/db';
import { transactions } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';
import { localFileAbsolute } from '@/lib/s3';
import fs from 'fs';
import path from 'path';

function extractTransactionId(pathname: string): string | null {
  const parts = pathname.split('/').filter(Boolean); // ['', 'api', 'transactions', ':id'] -> ['api','transactions',':id']
  const idx = parts.indexOf('transactions');
  if (idx === -1 || idx + 1 >= parts.length) return null;
  const candidate = parts[idx + 1];
  if (!candidate || candidate === 'transactions') return null;
  return candidate;
}

// DELETE /api/transactions/:transactionId
export async function DELETE(req: NextRequest) {
  const transactionId = extractTransactionId(req.nextUrl.pathname);
  if (!transactionId) return NextResponse.json({ error: 'id required' }, { status: 400 });
  try {
    const rows = await db.select().from(transactions).where(eq(transactions.id, transactionId)).limit(1);
    const row = rows[0];
    if (!row) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    if (row.receiptUrl) {
      const prefix = '/api/files/';
      if (row.receiptUrl.startsWith(prefix)) {
        let keyPart = row.receiptUrl.slice(prefix.length);
        try { keyPart = decodeURIComponent(keyPart); } catch {}
        const abs = localFileAbsolute(keyPart);
        if (abs.startsWith(path.resolve(process.cwd()))) {
          if (fs.existsSync(abs)) {
            try { fs.unlinkSync(abs); } catch (e) { console.warn('RECEIPT_DELETE_WARN', e); }
          }
        }
      }
    }
    await db.delete(transactions).where(eq(transactions.id, transactionId));
    return NextResponse.json({ deleted: true });
  } catch (e: any) {
    console.error('TRANSACTION_DELETE_ERROR', e);
    return NextResponse.json({ error: 'delete_failed', detail: e?.message }, { status: 500 });
  }
}
