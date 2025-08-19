import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/drizzle/db';
import { users } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

// GET /api/auth/me - derive user from uid cookie
export async function GET(req: NextRequest) {
  const uid = req.cookies.get('uid')?.value;
  if (!uid) return NextResponse.json({ user: null }, { status: 200 });
  const row = await db.select({ id: users.id, username: users.username, role: users.role, permissions: users.permissions })
    .from(users)
    .where(eq(users.id, uid))
    .limit(1);
  const u = row[0];
  if (!u) return NextResponse.json({ user: null }, { status: 200 });
  return NextResponse.json({ user: u });
}
