"use client";
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { useRouter } from 'next/navigation';

type User = { id: string; username: string; role?: string };

export default function ProjectMembersManager({ projectId, pmUsers, initialManagerIds }: { projectId: string; pmUsers: User[]; initialManagerIds: string[] }) {
  const router = useRouter();
  const { show } = useToast();
  const [managerIds, setManagerIds] = useState<string[]>(initialManagerIds);
  const [addingId, setAddingId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const managerSet = new Set(managerIds);
  const currentManagers = pmUsers.filter((u) => managerSet.has(u.id));
  const available = pmUsers.filter((u) => !managerSet.has(u.id));

  const addManager = async () => {
    if (!addingId) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: addingId }),
      });
      if (!res.ok) throw new Error();
      setManagerIds((ids) => [...ids, addingId]);
      setAddingId('');
      show({ variant: 'success', title: 'تمت الإضافة', description: 'تم تعيين مدير للمشروع' });
      router.refresh();
    } catch {
      show({ variant: 'destructive', title: 'خطأ', description: 'تعذر إضافة المدير' });
    } finally {
      setSubmitting(false);
    }
  };

  const removeManager = async (userId: string) => {
    if (!confirm('إزالة هذا المدير من المشروع؟')) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/members?userId=${encodeURIComponent(userId)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setManagerIds((ids) => ids.filter((id) => id !== userId));
      show({ variant: 'success', title: 'تمت الإزالة', description: 'تمت إزالة المدير' });
      router.refresh();
    } catch {
      show({ variant: 'destructive', title: 'خطأ', description: 'تعذر إزالة المدير' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      <ul className="text-sm space-y-2">
        {currentManagers.length === 0 && <li className="text-[var(--color-text-secondary)]">لا يوجد مديرون حاليًا</li>}
        {currentManagers.map((u) => (
          <li key={u.id} className="flex items-center justify-between gap-2">
            <span>{u.username}</span>
            <Button size="sm" variant="destructive" disabled={submitting} onClick={() => removeManager(u.id)}>إزالة</Button>
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-2">
        <select
          className="flex-1 h-10 rounded-[12px] border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-md px-3 text-sm"
          value={addingId}
          onChange={(e) => setAddingId(e.target.value)}
          disabled={submitting || available.length === 0}
        >
          <option value="">— اختر مديرًا —</option>
          {available.map((u) => (
            <option key={u.id} value={u.id}>{u.username}</option>
          ))}
        </select>
        <Button disabled={!addingId || submitting} onClick={addManager}>إضافة</Button>
      </div>
    </div>
  );
}
