import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../drizzle/db';
import { suppliers } from '../../../drizzle/schema';
import { eq, ilike } from 'drizzle-orm';

// GET /api/suppliers (Admin/Mod/PM)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  const rows = q
    ? await db.select().from(suppliers).where(ilike(suppliers.name, `%${q}%`))
    : await db.select().from(suppliers);
  return NextResponse.json({ suppliers: rows });
}

// POST /api/suppliers (Admin/Mod)
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as any;
  const name = body?.name as string | undefined;
  const balance = Number(body?.balance ?? 0);
  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });
  const [created] = await db.insert(suppliers).values({ name, balance: Number.isFinite(balance) ? balance : 0 }).returning();
  return NextResponse.json({ supplier: created }, { status: 201 });
}
