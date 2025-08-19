import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/drizzle/db';
import { tools } from '@/drizzle/schema';
import { eq, ilike, and } from 'drizzle-orm';

// GET /api/tools?search=hammer
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search');
  let rows;
  if (search) {
    rows = await db.select().from(tools).where(ilike(tools.name, `%${search}%`));
  } else {
    rows = await db.select().from(tools);
  }
  return NextResponse.json({ tools: rows });
}

// POST /api/tools { name, location }
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as any;
  const name = (body?.name || '').trim();
  const location = (body?.location || '').trim();
  if (!name || !location) return NextResponse.json({ error: 'name and location required' }, { status: 400 });
  const [created] = await db.insert(tools).values({ name, location }).returning();
  return NextResponse.json({ tool: created }, { status: 201 });
}
