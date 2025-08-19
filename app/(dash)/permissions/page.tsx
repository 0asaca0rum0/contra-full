"use client";
import { useEffect, useState, useMemo } from 'react';
import { DEFAULT_PERMISSIONS } from '@/lib/permissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';

type User = { id: string; username: string; role: 'ADMIN'|'MOD'|'PM'; permissions?: string[] };

// Canonical permission keys (params) aligned with backend & seeding
const PERMISSION_KEYS = [
  { key: 'ALL', label: 'كل الصلاحيات' },
  { key: 'USERS_READ', label: 'قراءة المستخدمين' },
  { key: 'PROJECTS_READ', label: 'عرض المشاريع' },
  { key: 'PROJECTS_MANAGE', label: 'إدارة المشاريع' },
  { key: 'ATTENDANCE_READ', label: 'عرض الحضور' },
  { key: 'ATTENDANCE_MARK', label: 'تسجيل الحضور' },
  { key: 'EXPENSE_CREATE', label: 'إنشاء مصروف' },
  { key: 'WAREHOUSE_READ', label: 'قراءة المخزن' },
];

export default function PermissionsPage() {
  const { show } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users', { cache: 'no-store' });
      const data = await res.json();
      setUsers(data.users || []);
    } catch {
      show({ variant: 'destructive', title: 'خطأ', description: 'تعذر جلب المستخدمين' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const has = (u: User, key: string) => (u.permissions || []).includes(key);
  const toggle = (u: User, key: string) => {
    const current = new Set(u.permissions || []);
    if (current.has(key)) current.delete(key); else current.add(key);
    setUsers(prev => prev.map(x => x.id === u.id ? { ...x, permissions: Array.from(current) } : x));
  };

  const setRow = (u: User, check: boolean) => {
    setUsers(prev => prev.map(x => x.id === u.id ? { ...x, permissions: check ? PERMISSION_KEYS.map(p => p.key) : [] } : x));
  };

  const saveRow = async (u: User) => {
    setSaving(u.id);
    try {
      const res = await fetch(`/api/admin/users/${u.id}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: u.permissions || [] }),
      });
      if (!res.ok) throw new Error();
      show({ variant: 'success', title: 'تم الحفظ', description: `تم حفظ صلاحيات ${u.username}` });
    } catch {
      show({ variant: 'destructive', title: 'خطأ', description: 'تعذر حفظ الصلاحيات' });
    } finally {
      setSaving(null);
    }
  };

  const applyRoleDefault = (u: User) => {
    setUsers(prev => prev.map(x => x.id === u.id ? { ...x, permissions: roleDefault(u.role) } : x));
  };

  const roleDefault = (role: User['role']) => DEFAULT_PERMISSIONS[role];
  const isDefault = (u: User) => {
    if (!u.permissions) return false;
    const sortedA = [...u.permissions].sort().join('|');
    const sortedB = [...roleDefault(u.role)].sort().join('|');
    return sortedA === sortedB;
  };

  const filteredPermissionKeys = useMemo(()=> PERMISSION_KEYS, []);

  const filteredUsers = useMemo(()=>{
    if (!filter.trim()) return users;
    const f = filter.trim().toLowerCase();
    return users.filter(u => u.username.toLowerCase().includes(f) || u.role.toLowerCase().includes(f));
  }, [users, filter]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl section-title">الصلاحيات</h1>
      <Card className="glass-card border border-[var(--glass-border)] shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle className="text-xl">إدارة الصلاحيات لكل مستخدم <span className="text-xs font-normal text-[var(--color-text-secondary)]">(Permission Params)</span></CardTitle>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <input
                placeholder="بحث عن مستخدم أو دور..."
                value={filter}
                onChange={e=>setFilter(e.target.value)}
                className="flex-1 md:w-64 rounded-lg border border-emerald-200 bg-white/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300/60 focus:border-emerald-400"
              />
              <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading} className="whitespace-nowrap">تحديث</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="mb-6 grid gap-3 sm:grid-cols-3 text-[13px]">
            {(['ADMIN','MOD','PM'] as const).map(r => (
              <div key={r} className="rounded-lg border border-[var(--glass-border)] bg-white/40 backdrop-blur-sm p-3 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-[var(--color-text)]">{r}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">افتراضي</span>
                </div>
                <div dir="ltr" className="flex flex-wrap gap-1">
                  {roleDefault(r).map(p => <span key={p} className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-mono tracking-tight border border-emerald-100">{p}</span>)}
                </div>
              </div>
            ))}
          </div>
          <div className="relative overflow-x-auto rounded-lg ring-1 ring-[var(--glass-border)]">
            <table className="w-full text-sm">
              <thead className="bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/40 sticky top-0 z-10">
                <tr className="border-b border-[var(--glass-border)]">
                  <th className="text-right py-2 px-3 min-w-[140px] sticky right-0 bg-white/80 backdrop-blur font-medium">المستخدم</th>
                  <th className="text-right py-2 px-3 min-w-[70px] sticky right-[140px] bg-white/80 backdrop-blur font-medium">الدور</th>
                  {filteredPermissionKeys.map((p) => (
                    <th key={p.key} className="text-center py-2 px-3 text-[11px] text-[var(--color-text-secondary)] whitespace-nowrap">{p.label}</th>
                  ))}
                  <th className="text-center py-2 px-3">الحالة</th>
                  <th className="text-center py-2 px-3">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td className="py-4 px-3" colSpan={filteredPermissionKeys.length + 5}>جارٍ التحميل…</td></tr>
                ) : filteredUsers.length === 0 ? (
                  <tr><td className="py-4 px-3" colSpan={filteredPermissionKeys.length + 5}>لا يوجد مستخدمون</td></tr>
                ) : (
                  filteredUsers.map((u) => {
                    const rowExpanded = expanded[u.id];
                    return (
                      <tr key={u.id} className="border-b last:border-b-0 border-[var(--glass-border)] hover:bg-emerald-50/30">
                        <td className="py-3 px-3 font-medium align-top sticky right-0 bg-white/70 backdrop-blur">
                          <button
                            onClick={()=>setExpanded(e=>({...e,[u.id]:!e[u.id]}))}
                            className="text-[11px] text-emerald-600 hover:underline mb-1 inline-block"
                          >{rowExpanded? 'إخفاء':'عرض'} المفاتيح</button>
                          <div>{u.username}</div>
                          {rowExpanded && (
                            <div dir="ltr" className="mt-2 flex flex-wrap gap-1 max-w-[220px]">
                              {(u.permissions||[]).map(p => <span key={p} className="px-2 py-0.5 rounded bg-emerald-600/10 text-emerald-700 border border-emerald-200 text-[10px] font-mono tracking-tight">{p}</span>)}
                              {(!u.permissions || u.permissions.length===0) && <span className="text-[10px] text-[var(--color-text-secondary)]">—</span>}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-xs font-semibold text-[var(--color-text-secondary)] align-top sticky right-[140px] bg-white/70 backdrop-blur">{u.role}</td>
                        {filteredPermissionKeys.map((p) => {
                          const disabled = has(u,'ALL') && p.key !== 'ALL';
                          return (
                            <td key={p.key} className="py-3 px-3 text-center align-top">
                              <input
                                type="checkbox"
                                checked={has(u, p.key)}
                                onChange={() => !disabled && toggle(u, p.key)}
                                disabled={disabled}
                                className="h-4 w-4 accent-[var(--color-primary)] disabled:opacity-30"
                                aria-label={p.label}
                              />
                            </td>
                          );
                        })}
                        <td className="py-3 px-3 text-center align-top">
                          {isDefault(u) ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-[11px]">افتراضي</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-[11px]">مخصص</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center align-top">
                          <div className="flex flex-col gap-1 items-stretch min-w-[120px]">
                            <Button size="sm" variant="outline" onClick={() => applyRoleDefault(u)} className="h-7 text-[11px]">افتراضي الدور</Button>
                            <div className="flex gap-1">
                              <Button size="sm" variant="outline" onClick={() => setRow(u, true)} className="flex-1 h-7 text-[11px]">الكل</Button>
                              <Button size="sm" variant="outline" onClick={() => setRow(u, false)} className="flex-1 h-7 text-[11px]">مسح</Button>
                            </div>
                            <Button size="sm" onClick={() => saveRow(u)} disabled={saving === u.id} className="h-7 text-[11px]">{saving === u.id ? 'جارٍ…' : 'حفظ'}</Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
