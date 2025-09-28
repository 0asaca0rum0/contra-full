import { NextRequest } from 'next/server';
import { db } from '@/drizzle/db';
import { users } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { apiError, apiSuccess, handleZod, logger } from '@/lib/api';
import { loadAuthContext, hasRequired } from '@/lib/authz';
import { AppRole, DEFAULT_PERMISSIONS, resolveDefaultPermissions } from '@/lib/permissions';

type UserRow = { id: string; username: string; role: AppRole; permissions: string[] };

const STATIC_PERMISSION_KEYS = [
  'ALL',
  ...new Set(
    Object.values(DEFAULT_PERMISSIONS)
      .flat()
      .map((p) => p.toUpperCase())
  ),
  'USERS_READ',
  'PROJECTS_READ',
  'PROJECTS_MANAGE',
  'ATTENDANCE_READ',
  'ATTENDANCE_MARK',
  'EXPENSE_CREATE',
  'WAREHOUSE_READ',
  'BUDGET_ADJUST',
];

const AVAILABLE_PERMISSION_KEYS = Array.from(new Set(STATIC_PERMISSION_KEYS)).sort();

const PermissionsPayloadSchema = z
  .object({
    permissions: z.array(z.string().min(1).max(64)).max(64).optional(),
    mode: z.enum(['set', 'reset']).optional(),
    syncWithRole: z.boolean().optional(),
  })
  .refine(
    (data) => data.mode === 'reset' || data.syncWithRole || Array.isArray(data.permissions),
    { message: 'permissions array is required when mode="set"', path: ['permissions'] }
  );

function sortPermissions(list: string[] | null | undefined) {
  return [...(list ?? [])].map((p) => p.toUpperCase()).sort();
}

function normalizePermissions(raw: string[] | null | undefined) {
  const clean = (raw ?? [])
    .map((value) => value.trim().toUpperCase())
    .filter(Boolean);
  if (clean.includes('ALL')) {
    return { allowed: ['ALL'], unknown: [] };
  }
  const unique = Array.from(new Set(clean));
  const unknown = unique.filter((p) => !AVAILABLE_PERMISSION_KEYS.includes(p));
  const allowed = unique.filter((p) => AVAILABLE_PERMISSION_KEYS.includes(p));
  return { allowed: sortPermissions(allowed), unknown }; // already sorted
}

async function fetchUser(userId: string): Promise<UserRow | null> {
  const rows = await db
    .select({ id: users.id, username: users.username, role: users.role, permissions: users.permissions })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  const normalized = sortPermissions((row as any).permissions ?? []);
  return {
    id: row.id,
    username: row.username,
    role: row.role as AppRole,
    permissions: normalized,
  };
}

function computeEffective(user: UserRow) {
  return user.permissions.length > 0
    ? user.permissions
    : sortPermissions(resolveDefaultPermissions(user.role, null));
}

function buildPayload(user: UserRow) {
  return {
    user,
    effectivePermissions: computeEffective(user),
    defaults: {
      role: user.role,
      permissions: sortPermissions(resolveDefaultPermissions(user.role, null)),
    },
    availablePermissionKeys: AVAILABLE_PERMISSION_KEYS,
  };
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ userId: string }> }) {
  const auth = await loadAuthContext();
  if (!auth.userId) return apiError(req, 'unauthorized', 'غير مصرح', 401);
  if (!hasRequired(auth.permissions, { anyOf: ['ALL', 'USERS_READ'] })) {
    return apiError(req, 'forbidden', 'ممنوع', 403);
  }

  const { userId } = await ctx.params;
  const user = await fetchUser(userId);
  if (!user) return apiError(req, 'not_found', 'المستخدم غير موجود', 404);

  return apiSuccess(req, buildPayload(user));
}

// PUT /api/admin/users/:userId/permissions (Admin)
export async function PUT(req: NextRequest, ctx: { params: Promise<{ userId: string }> }) {
  const auth = await loadAuthContext();
  if (!auth.userId) return apiError(req, 'unauthorized', 'غير مصرح', 401);
  if (!hasRequired(auth.permissions, { anyOf: ['ALL'] })) {
    return apiError(req, 'forbidden', 'لا تملك صلاحية التعديل', 403);
  }

  const { userId } = await ctx.params;
  const user = await fetchUser(userId);
  if (!user) return apiError(req, 'not_found', 'المستخدم غير موجود', 404);

  let parsed: z.infer<typeof PermissionsPayloadSchema>;
  try {
    parsed = PermissionsPayloadSchema.parse(await req.json());
  } catch (error) {
    return handleZod(req, error);
  }

  const mode = parsed.mode ?? 'set';
  const shouldSyncWithRole = parsed.syncWithRole || mode === 'reset';

  let nextPermissions: string[];
  if (shouldSyncWithRole) {
    nextPermissions = sortPermissions(resolveDefaultPermissions(user.role, null));
  } else {
    const { allowed, unknown } = normalizePermissions(parsed.permissions);
    if (unknown.length) {
      return apiError(req, 'unknown_permission', 'مفاتيح صلاحيات غير معروفة', 422, { invalidKeys: unknown });
    }
    nextPermissions = allowed;
  }

  try {
    const [updated] = await db
      .update(users)
      .set({ permissions: nextPermissions })
      .where(eq(users.id, userId))
      .returning({ id: users.id, username: users.username, role: users.role, permissions: users.permissions });

    if (!updated) return apiError(req, 'not_found', 'المستخدم غير موجود', 404);

    const updatedUser: UserRow = {
      id: updated.id,
      username: updated.username,
      role: updated.role as AppRole,
      permissions: sortPermissions((updated as any).permissions ?? []),
    };

    logger.info(
      {
        actorId: auth.userId,
        targetUserId: userId,
        mode,
        appliedDefaults: shouldSyncWithRole,
        permissionsCount: nextPermissions.length,
      },
      'permissions_updated'
    );

    return apiSuccess(req, { ...buildPayload(updatedUser), applied: updatedUser.permissions });
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : String(error), userId },
      'permissions_update_failed'
    );
    return apiError(req, 'update_failed', 'تعذر تحديث الصلاحيات', 500);
  }
}
