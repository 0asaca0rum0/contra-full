import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/drizzle/db';
import { users } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { resolveDefaultPermissions } from '@/lib/permissions';

// GET /api/admin/users (Admin only)
export async function GET(_req: NextRequest) {
  const rows = await db
    .select({ id: users.id, username: users.username, role: users.role, permissions: users.permissions, createdAt: users.createdAt })
    .from(users);
  return new NextResponse(JSON.stringify({ users: rows }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      // Allow short cache & stale-while-revalidate to reduce DB hits for frequently read list
      'Cache-Control': 'public, max-age=30, s-maxage=60, stale-while-revalidate=120'
    }
  });
}

// POST /api/admin/users (Admin only)
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as any;
  const username = body?.username;
  const password = body?.password;
  const role = body?.role as 'ADMIN'|'MOD'|'PM' | undefined;
  const rawPerms = Array.isArray(body?.permissions) ? body.permissions.map(String) : [];

  if (!username || !password || !role) {
    return NextResponse.json({ error: 'username, password, role are required' }, { status: 400 });
  }
  const existing = await db.select().from(users).where(eq(users.username, username)).limit(1);
  if (existing[0]) {
    return NextResponse.json({ error: 'Username already exists' }, { status: 409 });
  }
  const hash = await bcrypt.hash(password, 10);
  const permissions = resolveDefaultPermissions(role, rawPerms);
  const [created] = await db.insert(users).values({ username, password: hash, role, permissions }).returning({
    id: users.id,
    username: users.username,
    role: users.role,
    permissions: users.permissions,
    createdAt: users.createdAt,
  });
  return NextResponse.json({ user: created }, { status: 201 });
}
