"use client";
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';

type Project = { id: string; name: string; totalBudget?: number };

export default function ProjectsManager({ initial }: { initial: Project[] }) {
  const { show } = useToast();
  const [projects, setProjects] = useState<Project[]>(initial);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', pmIds: [] as string[] });
  // Editing moved into project detail page; keep no local editing state
  const [pms, setPms] = useState<Array<{ id: string; username: string }>>([]);
  const [pmsLoading, setPmsLoading] = useState(false);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/projects', { cache: 'no-store' });
      const data = await res.json();
      setProjects(data.projects || []);
    } catch {
      show({ variant: 'destructive', title: 'خطأ', description: 'تعذر جلب المشاريع' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // refresh after hydration to reflect latest
    fetchProjects();
    // fetch PM users for dropdown
    (async () => {
      setPmsLoading(true);
      try {
        const res = await fetch('/api/admin/users', { cache: 'no-store' });
        const data = await res.json();
        const onlyPMs = Array.isArray(data?.users)
          ? data.users.filter((u: any) => u.role === 'PM').map((u: any) => ({ id: u.id, username: u.username }))
          : [];
        setPms(onlyPMs);
      } catch {
        // silent; dropdown remains empty
      } finally {
        setPmsLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onCreate = async () => {
    const name = form.name.trim();
    if (!name) {
      show({ variant: 'warning', title: 'تنبيه', description: 'يرجى إدخال اسم المشروع' });
      return;
    }
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const project = data.project as Project;
      // optionally assign one or more PMs (no budget)
      for (const pmId of form.pmIds) {
        await fetch(`/api/projects/${project.id}/members`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: pmId }),
        });
      }
      show({ variant: 'success', title: 'تمت الإضافة', description: 'تم إنشاء المشروع' });
  setForm({ name: '', pmIds: [] });
      setCreating(false);
      fetchProjects();
    } catch {
      show({ variant: 'destructive', title: 'خطأ', description: 'تعذر إنشاء المشروع' });
    }
  };

  const openProject = (id: string) => {
    window.location.href = `/projects/${id}`;
  };

  const onDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المشروع؟')) return;
    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        show({ variant: 'warning', title: 'تعذر الحذف', description: data?.error || 'قد توجد سجلات مرتبطة تمنع الحذف.' });
        return;
      }
      show({ variant: 'success', title: 'تم الحذف', description: 'تم حذف المشروع' });
      fetchProjects();
    } catch {
      show({ variant: 'destructive', title: 'خطأ', description: 'تعذر حذف المشروع' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg section-title">إدارة المشاريع</h2>
        <Button variant="default" onClick={() => setCreating((v) => !v)}>{creating ? 'إلغاء' : 'إضافة مشروع'}</Button>
      </div>

      {creating && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>مشروع جديد</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm mb-1">اسم المشروع</label>
                <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm mb-1">مديرو المشروع (اختياري - متعدد)</label>
                <select
                  multiple
                  className="w-full min-h-24 rounded-[12px] border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-md px-3 py-2 text-sm"
                  value={form.pmIds}
                  onChange={(e) => {
                    const opts = Array.from(e.target.selectedOptions).map((o) => o.value);
                    setForm((f) => ({ ...f, pmIds: opts }));
                  }}
                  disabled={pmsLoading}
                >
                  {pms.map((u) => (
                    <option key={u.id} value={u.id}>{u.username}</option>
                  ))}
                </select>
                <div className="text-xs text-[var(--color-text-secondary)] mt-1">يمكنك اختيار أكثر من مدير للمشروع.</div>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button onClick={onCreate}>حفظ</Button>
              <Button variant="outline" onClick={() => { setCreating(false); setForm({ name: '', pmIds: [] }); }}>إلغاء</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="glass-card">
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[var(--color-text-secondary)]">
                  <th className="text-right py-2">الاسم</th>
                  <th className="text-right py-2">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td className="py-4" colSpan={2}>جارٍ التحميل…</td></tr>
                ) : projects.length === 0 ? (
                  <tr><td className="py-4" colSpan={2}>لا توجد مشاريع</td></tr>
                ) : (
                  projects.map((p) => (
                    <tr key={p.id} className="border-t border-[var(--glass-border)]">
                      <td className="py-3 align-top">
                        <div className="font-medium">{p.name}</div>
                        <div className="text-xs text-[var(--color-text-secondary)]"># {p.id.slice(0,8)}</div>
                      </td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => openProject(p.id)}>فتح</Button>
                          <Button size="sm" variant="destructive" onClick={() => onDelete(p.id)}>حذف</Button>
                        </div>
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
