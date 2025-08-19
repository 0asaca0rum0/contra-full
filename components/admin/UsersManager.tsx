"use client";
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { motion, AnimatePresence } from 'framer-motion';

type User = { id: string; username: string; role: 'ADMIN' | 'MOD' | 'PM'; permissions?: string[] };

export default function UsersManager() {
  const { show } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ username: '', password: '', role: 'PM' as User['role'], permissions: '' });

  const roleOptions = useMemo(() => ([
    { value: 'ADMIN', label: 'مسؤول' },
    { value: 'MOD', label: 'مشرف' },
    { value: 'PM', label: 'مدير مشروع' },
  ]), []);

  const resetForm = () => setForm({ username: '', password: '', role: 'PM', permissions: '' });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users', { cache: 'no-store' });
      const data = await res.json();
      setUsers(data.users || []);
    } catch (e) {
      show({ variant: 'destructive', title: 'خطأ', description: 'تعذر جلب المستخدمين' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const onCreate = async () => {
    if (!form.username || !form.password) {
      show({ variant: 'warning', title: 'تنبيه', description: 'يرجى إدخال اسم المستخدم وكلمة المرور' });
      return;
    }
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.username,
          password: form.password,
          role: form.role,
          permissions: form.permissions ? form.permissions.split(',').map(s => s.trim()).filter(Boolean) : [],
        }),
      });
      if (!res.ok) throw new Error();
      show({ variant: 'success', title: 'تمت الإضافة', description: 'تم إنشاء المستخدم بنجاح' });
      resetForm();
      setCreating(false);
      fetchUsers();
    } catch {
      show({ variant: 'destructive', title: 'خطأ', description: 'تعذر إنشاء المستخدم' });
    }
  };

  const onEdit = (u: User) => {
    setEditingId(u.id);
    setForm({ username: u.username, password: '', role: u.role, permissions: (u.permissions || []).join(',') });
  };

  const onUpdate = async () => {
    if (!editingId) return;
    try {
      const payload: any = { username: form.username, role: form.role, permissions: form.permissions ? form.permissions.split(',').map(s => s.trim()).filter(Boolean) : [] };
      if (form.password) payload.password = form.password;
      const res = await fetch(`/api/admin/users/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      show({ variant: 'success', title: 'تم التحديث', description: 'تم تحديث المستخدم' });
      setEditingId(null);
      resetForm();
      fetchUsers();
    } catch {
      show({ variant: 'destructive', title: 'خطأ', description: 'تعذر تحديث المستخدم' });
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 409) {
          show({ variant: 'warning', title: 'تعذر الحذف', description: data?.error || 'لدى المستخدم نشاط مرتبط (حضور/معاملات). قم بإزالته من المشاريع أو أرشفة السجلات أولاً.' });
        } else if (res.status === 404) {
          show({ variant: 'warning', title: 'غير موجود', description: 'المستخدم غير موجود' });
        } else {
          throw new Error();
        }
        return;
      }
      show({ variant: 'success', title: 'تم الحذف', description: 'تم حذف المستخدم' });
      fetchUsers();
    } catch {
      show({ variant: 'destructive', title: 'خطأ', description: 'تعذر حذف المستخدم' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg section-title">المستخدمون</h2>
        <Button variant="default" onClick={() => { setCreating((v) => !v); setEditingId(null); resetForm(); }}>
          {creating ? 'إلغاء' : 'إضافة مستخدم'}
        </Button>
      </div>

      <AnimatePresence initial={false}>
        {creating && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>مستخدم جديد</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm mb-1">اسم المستخدم</label>
                    <Input value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">كلمة المرور</label>
                    <Input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">الدور</label>
                    <select
                      className="w-full h-10 rounded-[12px] border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-md px-3 text-sm"
                      value={form.role}
                      onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as User['role'] }))}
                    >
                      {roleOptions.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm mb-1">الصلاحيات (مفصولة بفاصلة)</label>
                    <Input value={form.permissions} onChange={(e) => setForm((f) => ({ ...f, permissions: e.target.value }))} placeholder="perm1,perm2" />
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button onClick={onCreate}>حفظ</Button>
                  <Button variant="outline" onClick={() => { setCreating(false); resetForm(); }}>إلغاء</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Card className="glass-card">
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[var(--color-text-secondary)]">
                  <th className="text-right py-2">اسم المستخدم</th>
                  <th className="text-right py-2">الدور</th>
                  <th className="text-right py-2">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td className="py-4" colSpan={3}>جارٍ التحميل…</td></tr>
                ) : users.length === 0 ? (
                  <tr><td className="py-4" colSpan={3}>لا يوجد مستخدمون</td></tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="border-t border-[var(--glass-border)]">
                      <td className="py-3">
                        {editingId === u.id ? (
                          <Input value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} />
                        ) : (
                          u.username
                        )}
                      </td>
                      <td className="py-3">
                        {editingId === u.id ? (
                          <select
                            className="w-full h-10 rounded-[12px] border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-md px-3 text-sm"
                            value={form.role}
                            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as User['role'] }))}
                          >
                            {roleOptions.map((r) => (
                              <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                          </select>
                        ) : (
                          roleOptions.find(r => r.value === u.role)?.label || u.role
                        )}
                      </td>
                      <td className="py-3">
                        {editingId === u.id ? (
                          <div className="flex gap-2">
                            <Button size="sm" onClick={onUpdate}>حفظ</Button>
                            <Button size="sm" variant="outline" onClick={() => { setEditingId(null); resetForm(); }}>إلغاء</Button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => onEdit(u)}>تعديل</Button>
                            <Button size="sm" variant="destructive" onClick={() => onDelete(u.id)}>حذف</Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
