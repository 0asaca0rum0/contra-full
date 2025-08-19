import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/drizzle/db';
import { users, projectManagers, attendance as attendanceTbl, warehouseTransactions, transactions as transactionsTbl } from '@/drizzle/schema';
import { eq, sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { resolveDefaultPermissions } from '@/lib/permissions';

// PUT /api/admin/users/:id (Admin only)
export async function PUT(req: NextRequest, ctx: { params: Promise<{ userId: string }> }) {
  const { userId } = await ctx.params;
  const body = await req.json().catch(() => null) as any;
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });

  const updates: Partial<{ username: string; password: string; role: 'ADMIN'|'MOD'|'PM'; permissions: string[] }> = {};
  if (typeof body.username === 'string') updates.username = body.username;
  if (typeof body.role === 'string') updates.role = body.role;
  if (Array.isArray(body.permissions)) {
    updates.permissions = body.permissions.map(String);
  } else if (typeof body.role === 'string') {
    updates.permissions = resolveDefaultPermissions(body.role as any, null);
  }
  if (typeof body.password === 'string' && body.password) {
    updates.password = await bcrypt.hash(body.password, 10);
  }

  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });

  const [updated] = await db
    .update(users)
    .set(updates as any)
    .where(eq(users.id, userId))
    .returning({ id: users.id, username: users.username, role: users.role, permissions: users.permissions });
  if (!updated) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  return NextResponse.json({ user: updated });
}

// DELETE /api/admin/users/:id (Admin only)
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ userId: string }> }) {
  const { userId } = await ctx.params;

  // Ensure user exists
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.id, userId)).limit(1);
  if (!existing.length) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // Check FK dependencies that cannot be auto-removed
  const [attCountRes, trxCountRes, wtrxCountRes] = await Promise.all([
    db.execute(sql`SELECT COUNT(*)::int AS count FROM attendance WHERE marked_by_id = ${userId}`),
    db.execute(sql`SELECT COUNT(*)::int AS count FROM transactions WHERE user_id = ${userId}`),
    db.execute(sql`SELECT COUNT(*)::int AS count FROM warehouse_transactions WHERE user_id = ${userId}`),
  ]);
  const attCount = Number((attCountRes as any).rows?.[0]?.count ?? 0);
  const trxCount = Number((trxCountRes as any).rows?.[0]?.count ?? 0);
  const wtrxCount = Number((wtrxCountRes as any).rows?.[0]?.count ?? 0);

  if (attCount + trxCount + wtrxCount > 0) {
    return NextResponse.json({
      error: 'Cannot delete user with existing activity (attendance/transactions). Detach or archive records first.',
      details: { attendance: attCount, transactions: trxCount, warehouseTransactions: wtrxCount },
    }, { status: 409 });
  }

  // Safe to detach from project managers, then delete the user
  await db.delete(projectManagers).where(eq(projectManagers.userId, userId));

  const [deleted] = await db
    .delete(users)
    .where(eq(users.id, userId))
    .returning({ id: users.id });
  if (!deleted) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}
