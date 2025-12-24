"use client";
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { FiPlus, FiX } from 'react-icons/fi';

type Project = { id: string; name: string; totalBudget?: number };

export default function ProjectsManager() {
  const { show } = useToast();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', pmIds: [] as string[] });
  const [pms, setPms] = useState<Array<{ id: string; username: string }>>([]);
  const [pmsLoading, setPmsLoading] = useState(false);

  useEffect(() => {
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
        // silent
      } finally {
        setPmsLoading(false);
      }
    })();
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
      
      for (const pmId of form.pmIds) {
        await fetch(`/api/projects/${project.id}/members`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: pmId }),
        });
      }
      
      show({ variant: 'success', title: 'تمت الإضافة', description: 'تم إنشاء المشروع بنجاح' });
      setForm({ name: '', pmIds: [] });
      setCreating(false);
      // Refresh page to show new project card
      window.location.reload();
    } catch {
      show({ variant: 'destructive', title: 'خطأ', description: 'تعذر إنشاء المشروع' });
    }
  };

  return (
    <div className="space-y-4">
      {!creating ? (
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <FiPlus className="h-5 w-5" />
          <span>إضافة مشروع جديد</span>
        </button>
      ) : (
        <Card className="rounded-[2.5rem] border border-white/10 bg-[#1a1c1e] shadow-2xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 px-8 py-6">
            <CardTitle className="text-white text-xl font-bold">إنشاء مشروع جديد</CardTitle>
            <button
              onClick={() => setCreating(false)}
              className="p-2 ml-[-8px] rounded-xl bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-all"
            >
              <FiX className="h-6 w-6" />
            </button>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-400 uppercase tracking-widest mr-1">اسم المشروع</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="مثال: مشروع بناء فيلا..."
                  className="rounded-2xl bg-slate-800 border-white/10 text-white h-14 px-6 text-lg font-medium focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-400 uppercase tracking-widest mr-1">تعيين مديري المشروع</label>
                <select
                  multiple
                  className="w-full min-h-[160px] rounded-2xl bg-slate-800 border border-white/10 text-white px-6 py-4 text-base font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 custom-scrollbar"
                  value={form.pmIds}
                  onChange={(e) => {
                    const opts = Array.from(e.target.selectedOptions).map((o) => o.value);
                    setForm((f) => ({ ...f, pmIds: opts }));
                  }}
                  disabled={pmsLoading}
                >
                  {pms.map((u) => (
                    <option key={u.id} value={u.id} className="py-2 px-2 hover:bg-emerald-500/20 rounded-lg cursor-pointer">
                      {u.username}
                    </option>
                  ))}
                </select>
                <p className="text-[12px] text-emerald-500/60 font-bold mr-1">اضغط باستمرار على Ctrl (أو Cmd) لاختيار أكثر من مدير.</p>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  onClick={onCreate}
                  className="flex-1 h-14 rounded-2xl bg-emerald-500 text-white text-base font-black uppercase tracking-widest hover:bg-emerald-600 shadow-xl shadow-emerald-500/20 active:scale-[0.98] transition-all"
                >
                  حفظ المشروع
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCreating(false)}
                  className="h-14 px-8 rounded-2xl border-white/10 bg-slate-800 text-white font-bold hover:bg-slate-700"
                >
                  إلغاء
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
