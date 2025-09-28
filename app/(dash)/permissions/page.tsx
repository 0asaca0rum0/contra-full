"use client";

import { useEffect, useMemo, useState } from 'react';
import { DEFAULT_PERMISSIONS } from '@/lib/permissions';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import {
  FaArrowRotateRight,
  FaArrowsRotate,
  FaCircleCheck,
  FaCircleExclamation,
  FaCirclePlus,
  FaFilter,
  FaShieldHalved,
  FaUserGear,
  FaXmark,
} from 'react-icons/fa6';

interface User {
  id: string;
  username: string;
  role: 'ADMIN' | 'MOD' | 'PM';
  permissions?: string[];
}

interface PermissionsDetail {
  user: { id: string; username: string; role: User['role']; permissions: string[] };
  effectivePermissions: string[];
  defaults: { role: User['role']; permissions: string[] };
  availablePermissionKeys: string[];
  applied?: string[];
}

const PERMISSION_DEFS: Array<{ key: string; label: string }> = [
  { key: 'ALL', label: 'كل الصلاحيات' },
  { key: 'USERS_READ', label: 'قراءة المستخدمين' },
  { key: 'PROJECTS_READ', label: 'عرض المشاريع' },
  { key: 'PROJECTS_MANAGE', label: 'إدارة المشاريع' },
  { key: 'ATTENDANCE_READ', label: 'عرض الحضور' },
  { key: 'ATTENDANCE_MARK', label: 'تسجيل الحضور' },
  { key: 'EXPENSE_CREATE', label: 'إنشاء مصروف' },
  { key: 'WAREHOUSE_READ', label: 'قراءة المخزن' },
  { key: 'BUDGET_ADJUST', label: 'تعديل الموازنات' },
];

const labelFor = (key: string) => PERMISSION_DEFS.find((p) => p.key === key)?.label ?? key;
const roleDefaults = (role: User['role']) => [...(DEFAULT_PERMISSIONS[role] ?? [])];
const normalize = (perms?: string[]) => Array.from(new Set((perms ?? []).map((p) => p.toUpperCase()))).sort();

const isDefaultSet = (role: User['role'], perms?: string[]) => {
  const a = normalize(perms);
  const b = normalize(roleDefaults(role));
  return a.join('|') === b.join('|');
};

export default function PermissionsPage() {
  const { show } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<PermissionsDetail | null>(null);
  const [detailDraft, setDetailDraft] = useState<string[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users', { cache: 'no-store' });
      const data = await res.json();
      setUsers((data?.users ?? []).map((u: User) => ({ ...u, permissions: normalize(u.permissions) })));
    } catch {
      show({ variant: 'destructive', title: 'خطأ', description: 'تعذر جلب المستخدمين' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const term = filter.trim().toLowerCase();
    if (!term) return users;
    return users.filter(
      (u) => u.username.toLowerCase().includes(term) || u.role.toLowerCase().includes(term)
    );
  }, [users, filter]);

  const summary = useMemo(() => {
    const total = users.length;
    const admin = users.filter((u) => u.role === 'ADMIN').length;
    const moderators = users.filter((u) => u.role === 'MOD').length;
    const withCustom = users.filter((u) => !isDefaultSet(u.role, u.permissions)).length;
    return { total, admin, moderators, custom: withCustom };
  }, [users]);

  const openDetail = async (user: User) => {
    setSelectedId(user.id);
    setDetail(null);
    setDetailDraft([]);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/permissions`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.error?.message || 'REQUEST_FAILED');
      const payload = json.data as PermissionsDetail;
      setDetail(payload);
      setDetailDraft(payload.user.permissions);
    } catch (error: any) {
      show({ variant: 'destructive', title: 'خطأ', description: error?.message || 'تعذر تحميل التفاصيل' });
      setSelectedId(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelectedId(null);
    setDetail(null);
    setDetailDraft([]);
    setSaving(false);
  };

  const togglePermission = (key: string) => {
    setDetailDraft((prev) => {
      const has = prev.includes(key);
      if (has) {
        return prev.filter((p) => p !== key);
      }
      if (key === 'ALL') {
        return ['ALL'];
      }
      const next = prev.filter((p) => p !== 'ALL');
      return [...next, key].sort();
    });
  };

  const setDraftToDefaults = () => {
    if (!detail) return;
    setDetailDraft([...detail.defaults.permissions]);
  };

  const clearDraft = () => setDetailDraft([]);

  const draftChanged = detail ? detailDraft.join('|') !== detail.user.permissions.join('|') : false;
  const draftHasAll = detailDraft.includes('ALL');

  const saveDraft = async (mode: 'set' | 'reset') => {
    if (!detail || !selectedId) return;
    setSaving(true);
    try {
      const payload =
        mode === 'reset'
          ? { mode: 'reset' as const }
          : { mode: 'set' as const, permissions: detailDraft };
      const res = await fetch(`/api/admin/users/${selectedId}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.error?.message || 'REQUEST_FAILED');
      const updated = json.data as PermissionsDetail;
      setDetail(updated);
      setDetailDraft(updated.user.permissions);
      setUsers((prev) =>
        prev.map((u) => (u.id === selectedId ? { ...u, permissions: updated.user.permissions } : u))
      );
      show({ variant: 'success', title: 'تم الحفظ', description: `تم تحديث صلاحيات ${updated.user.username}` });
    } catch (error: any) {
      show({ variant: 'destructive', title: 'خطأ', description: error?.message || 'تعذر حفظ الصلاحيات' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <section className="rounded-3xl border border-emerald-100/70 bg-gradient-to-br from-emerald-50 via-white to-white/95 p-8 shadow-lg ring-1 ring-emerald-100/60">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <h1 className="flex items-center gap-3 text-2xl font-semibold text-emerald-950">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
                <FaShieldHalved className="text-lg" />
              </span>
              لوحة التحكم بالصلاحيات
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-emerald-900/75">
              راقب توزيع الصلاحيات عبر الأدوار المختلفة، وابحث بسرعة عن أي مستخدم لتعديل أذوناته أو إعادتها للوضع الافتراضي بسهولة.
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <div className="flex w-full items-center gap-3 rounded-full border border-emerald-200/70 bg-white/80 px-4 py-2.5 text-sm shadow-sm transition focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-100">
              <FaFilter className="text-emerald-500" />
              <input
                placeholder="بحث عن مستخدم أو دور..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full bg-transparent text-sm text-slate-600 outline-none placeholder:text-slate-400"
              />
              {filter && (
                <button onClick={() => setFilter('')} className="text-xs font-semibold text-emerald-600/80 transition hover:text-emerald-700">
                  مسح
                </button>
              )}
            </div>
            <Button
              variant="outline"
              onClick={fetchUsers}
              disabled={loading}
              className="h-11 rounded-full border-emerald-200/70 bg-white/80 px-5 text-sm font-semibold text-emerald-700 shadow-sm transition hover:border-emerald-300 hover:text-emerald-800"
            >
              <FaArrowsRotate className="text-[13px]" /> تحديث القائمة
            </Button>
          </div>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryStat title="إجمالي المستخدمين" value={summary.total} icon={<FaUserGear className="text-emerald-500" />} />
          <SummaryStat title="المدراء" value={summary.admin} subtitle="أذونات كاملة" icon={<FaCircleCheck className="text-emerald-500" />} />
          <SummaryStat title="المشرفون" value={summary.moderators} subtitle="محدودو الصلاحيات" icon={<FaCirclePlus className="text-emerald-500" />} />
          <SummaryStat title="صلاحيات مخصصة" value={summary.custom} subtitle="تختلف عن الافتراضي" icon={<FaCircleExclamation className="text-amber-500" />} />
        </div>
      </section>

      <Card className="overflow-hidden border border-emerald-100/70 bg-white/95 shadow-lg ring-1 ring-emerald-100/60">
        <CardContent className="flex flex-col gap-4 p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 pt-6">
            <div className="text-sm font-semibold text-slate-700">
              {loading ? 'جارٍ التحميل…' : `إظهار ${filteredUsers.length} مستخدم${filteredUsers.length !== 1 ? 'ين' : ''} في العرض الحالي`}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>آخر تحديث: لحظات قليلة</span>
              <span className="hidden h-1 w-1 rounded-full bg-emerald-300 sm:block" />
              <span>المجموع الكلي: {users.length}</span>
            </div>
          </div>
          <div className="overflow-x-auto pb-4">
            <table className="w-full table-auto text-sm">
              <thead className="bg-slate-50/90 text-[12px] font-medium text-slate-500">
                <tr className="border-y border-slate-200/70">
                  <th className="px-6 py-3 text-right font-semibold tracking-wide">المستخدم</th>
                  <th className="px-6 py-3 text-right font-semibold tracking-wide">الدور</th>
                  <th className="px-6 py-3 text-right font-semibold tracking-wide">الوضع</th>
                  <th className="px-6 py-3 text-right font-semibold tracking-wide">أبرز الصلاحيات</th>
                  <th className="px-6 py-3 text-center font-semibold tracking-wide">إدارة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-500">جارٍ التحميل…</td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-400">لا يوجد مستخدمون مطابقون لبحثك</td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const active = selectedId === user.id;
                    const custom = !isDefaultSet(user.role, user.permissions);
                    const displayPerms = (user.permissions ?? []).slice(0, 3);
                    const remaining = (user.permissions?.length ?? 0) - displayPerms.length;
                    return (
                      <tr
                        key={user.id}
                        className={`group transition-all duration-200 hover:-translate-y-[1px] hover:bg-emerald-50/40 ${active ? 'bg-emerald-50/60 shadow-inner' : ''}`}
                      >
                        <td className="px-6 py-4 align-top">
                          <div className="flex flex-col gap-1.5">
                            <span className="text-sm font-semibold text-slate-800">{user.username}</span>
                            <span className="text-xs text-slate-400">المعرّف: {user.id}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 align-top text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">{user.role}</td>
                        <td className="px-6 py-4 align-top">
                          <StatusBadge custom={custom} />
                        </td>
                        <td className="px-6 py-4 align-top">
                          <div dir="ltr" className="flex flex-wrap gap-1.5">
                            {displayPerms.length === 0 && (
                              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-medium text-slate-500">افتراضي ({roleDefaults(user.role).length})</span>
                            )}
                            {displayPerms.map((perm) => (
                              <span
                                key={perm}
                                className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-100"
                              >
                                {labelFor(perm)}
                              </span>
                            ))}
                            {remaining > 0 && (
                              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200/70">
                                +{remaining}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 align-top">
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openDetail(user)}
                              className="h-8 rounded-full border-emerald-200/70 px-3 text-[12px] font-semibold text-emerald-700 transition hover:border-emerald-300 hover:text-emerald-800"
                            >
                              إدارة
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, permissions: roleDefaults(user.role) } : u)));
                                show({
                                  variant: 'default',
                                  title: 'تم التطبيق محلياً',
                                  description: 'سيتم الحفظ بعد اختيار "إدارة" ثم الضغط على "حفظ"',
                                });
                              }}
                              className="h-8 rounded-full border-slate-200/80 px-3 text-[12px] font-semibold text-slate-500 hover:border-slate-300 hover:text-slate-700"
                            >
                              استعادة افتراضي
                            </Button>
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

      {selectedId && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 px-4 py-6 backdrop-blur-sm sm:items-center">
          <div className="absolute inset-0" onClick={closeDetail} />
          <div className="relative w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <header className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">تعديل صلاحيات المستخدم</h2>
                <p className="text-sm text-slate-500">اختر الصلاحيات المسموحة لهذا المستخدم، أو أعده إلى إعدادات الدور الافتراضية.</p>
              </div>
              <Button variant="ghost" size="icon" onClick={closeDetail} className="h-9 w-9 rounded-full text-slate-500 hover:text-slate-700">
                <FaXmark />
              </Button>
            </header>

            {detailLoading && <div className="mt-10 flex justify-center text-slate-500">جاري التحميل…</div>}

            {!detailLoading && detail && (
              <div className="mt-6 space-y-6">
                <div className="rounded-2xl bg-slate-50 px-5 py-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">المستخدم</span>
                      <h3 className="text-xl font-semibold text-slate-800">{detail.user.username}</h3>
                      <div className="text-sm text-slate-500">الدور الحالي: <span className="font-medium text-slate-700">{detail.user.role}</span></div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Tag tone="emerald">الصلاحيات الفعالة: {detail.effectivePermissions.length}</Tag>
                      <Tag tone="slate">أفتراضي الدور: {detail.defaults.permissions.length}</Tag>
                      {draftChanged && <Tag tone="amber">غير محفوظ</Tag>}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-slate-700">حدد الصلاحيات</h4>
                  <div className="flex flex-wrap gap-2" dir="ltr">
                    {detail.availablePermissionKeys.map((key) => {
                      const checked = detailDraft.includes(key);
                      const disabled = draftHasAll && key !== 'ALL';
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => !disabled && togglePermission(key)}
                          className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                            checked
                              ? 'border-emerald-500 bg-emerald-500 text-white shadow-sm'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:text-emerald-700'
                          } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                        >
                          <span>{labelFor(key)}</span>
                        </button>
                      );
                    })}
                  </div>
                  {draftHasAll && (
                    <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-[12px] text-emerald-700">
                      <FaShieldHalved /> صلاحية "كل الصلاحيات" تجعل باقي المفاتيح غير قابلة للتعديل.
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => saveDraft('set')}
                    disabled={saving || !draftChanged}
                    className="h-10 rounded-full px-4 text-sm"
                  >
                    {saving ? 'جارٍ الحفظ…' : 'حفظ التغييرات'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => saveDraft('reset')}
                    disabled={saving}
                    className="h-10 rounded-full px-4 text-sm"
                  >
                    استعادة افتراضي الدور
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={setDraftToDefaults}
                    disabled={saving}
                    className="h-10 rounded-full px-4 text-sm text-emerald-600 hover:text-emerald-700"
                  >
                    تطبيق افتراضي الدور
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={clearDraft}
                    disabled={saving}
                    className="h-10 rounded-full px-4 text-sm text-rose-600 hover:text-rose-700"
                  >
                    مسح الكل
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryStat({ title, value, subtitle, icon }: { title: string; value: number; subtitle?: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-white/80 px-4 py-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 text-lg">
        {icon ?? <FaShieldHalved />}
      </div>
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-500">{title}</div>
        <div className="text-xl font-semibold text-emerald-900">{value}</div>
        {subtitle && <div className="text-[11px] text-emerald-600/80">{subtitle}</div>}
      </div>
    </div>
  );
}

function StatusBadge({ custom }: { custom: boolean }) {
  return custom ? (
    <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold text-amber-700">
      <FaArrowRotateRight className="text-[10px]" /> مخصص
    </span>
  ) : (
    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold text-emerald-700">
      <FaCircleCheck className="text-[10px]" /> افتراضي
    </span>
  );
}

function Tag({ children, tone = 'slate' }: { children: React.ReactNode; tone?: 'slate' | 'emerald' | 'amber' }) {
  const toneMap: Record<string, string> = {
    slate: 'bg-slate-200/70 text-slate-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700',
  };
  return <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold ${toneMap[tone]}`}>{children}</span>;
}
