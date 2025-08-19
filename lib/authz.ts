import { cookies } from 'next/headers';
import { db } from '@/drizzle/db';
import { users } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

export type AuthContext = {
  userId: string | null;
  role: 'ADMIN'|'MOD'|'PM' | null;
  permissions: string[];
};

export async function loadAuthContext(): Promise<AuthContext> {
  const ck = await cookies();
  const uid = ck.get('uid')?.value || null;
  if (!uid) return { userId: null, role: null, permissions: [] };
  try {
    const row = await db.select({ id: users.id, role: users.role, permissions: users.permissions }).from(users).where(eq(users.id, uid)).limit(1);
    const u = row[0];
    if (!u) return { userId: null, role: null, permissions: [] };
    return { userId: u.id, role: u.role as any, permissions: (u as any).permissions || [] };
  } catch {
    return { userId: null, role: null, permissions: [] };
  }
}

const ROUTE_PERMISSION_MAP: { pattern: RegExp; anyOf?: string[]; allOf?: string[] }[] = [
  { pattern: /^\/api\/attendance/i, anyOf: ['ALL','ATTENDANCE_MARK','ATTENDANCE_READ'] },
  { pattern: /^\/api\/transactions/i, anyOf: ['ALL','EXPENSE_CREATE','PROJECTS_READ'] },
  { pattern: /^\/api\/warehouse/i, anyOf: ['ALL','WAREHOUSE_READ'] },
  { pattern: /^\/api\/suppliers/i, anyOf: ['ALL','PROJECTS_READ'] },
  { pattern: /^\/api\/projects/i, anyOf: ['ALL','PROJECTS_READ','PROJECTS_MANAGE'] },
  { pattern: /^\/api\/admin\/users/i, anyOf: ['ALL','USERS_READ'] },
  { pattern: /^\/api\/projects\/.+\/pm-budgets/i, anyOf: ['ALL','BUDGET_ADJUST'] },
];

export function routePermsForPath(path: string) {
  return ROUTE_PERMISSION_MAP.find(r => r.pattern.test(path));
}

export function hasRequired(perms: string[], rule?: { anyOf?: string[]; allOf?: string[] }) {
  if (!rule) return true;
  if (perms.includes('ALL')) return true;
  if (rule.allOf && !rule.allOf.every(p => perms.includes(p))) return false;
  if (rule.anyOf && !rule.anyOf.some(p => perms.includes(p))) return false;
  return true;
}
