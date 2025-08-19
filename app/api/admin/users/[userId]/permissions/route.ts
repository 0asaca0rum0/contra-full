import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/drizzle/db';
import { users } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

// PUT /api/admin/users/:userId/permissions (Admin)
export async function PUT(req: NextRequest, ctx: { params: Promise<{ userId: string }> }) {
  const { userId } = await ctx.params;
  const body = await req.json().catch(() => null) as any;
  const permissions = Array.isArray(body?.permissions) ? body.permissions.map(String) : null;
  if (!permissions) return NextResponse.json({ error: 'permissions array is required' }, { status: 400 });

  const [updated] = await db
    .update(users)
    .set({ permissions })
    .where(eq(users.id, userId))
    .returning({ id: users.id, username: users.username, role: users.role, permissions: users.permissions });
  if (!updated) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  return NextResponse.json({ user: updated });
}
