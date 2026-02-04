import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../drizzle/db';
import { suppliers } from '../../../drizzle/schema';
import { ilike } from 'drizzle-orm';

// GET /api/suppliers - List all suppliers with optional search (Admin/Mod/PM)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q');

  // Fetch suppliers with optional search filter
  const rows = query
    ? await db.select().from(suppliers).where(ilike(suppliers.name, `%${query}%`))
    : await db.select().from(suppliers);

  return NextResponse.json({ suppliers: rows });
}

// POST /api/suppliers - Create a new supplier (Admin/Mod)
export async function POST(req: NextRequest) {
  // Parse and validate request body
  const body = await req.json().catch(() => null) as any;
  if (!body) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  // Validate required fields
  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json({ error: 'name is required and cannot be empty' }, { status: 400 });
  }

  // Parse and validate balance
  const balance = Number(body.balance ?? 0);
  if (!Number.isFinite(balance)) {
    return NextResponse.json({ error: 'balance must be a valid number' }, { status: 400 });
  }

  // Create supplier
  const [created] = await db
    .insert(suppliers)
    .values({ name, balance })
    .returning();

  return NextResponse.json({ supplier: created }, { status: 201 });
}

