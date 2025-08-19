// Default permission sets per role.
export type AppRole = 'ADMIN'|'MOD'|'PM';

export const DEFAULT_PERMISSIONS: Record<AppRole, string[]> = {
  ADMIN: ['ALL'],
  MOD: ['USERS_READ','PROJECTS_READ','WAREHOUSE_READ','ATTENDANCE_READ','BUDGET_ADJUST'],
  PM: ['PROJECTS_READ','PROJECTS_MANAGE','ATTENDANCE_MARK','EXPENSE_CREATE'],
};

export function resolveDefaultPermissions(role: AppRole, provided?: string[] | null): string[] {
  if (provided && provided.length) return provided.map(String);
  return DEFAULT_PERMISSIONS[role].slice();
}
