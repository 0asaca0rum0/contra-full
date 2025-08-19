"use client";
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AllocationFormProps {
  projectId: string;
  pmUsers: Array<{ id: string; username: string }>;
  onSuccess?: () => void; // optional callback to trigger refresh
}

export default function AllocationForm({ projectId, pmUsers, onSuccess }: AllocationFormProps) {
  const { show } = useToast();
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0,10)); // yyyy-mm-dd
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    const n = Number(amount);
    if (!userId || !Number.isFinite(n) || n <= 0) {
      show({ variant: 'warning', title: 'تنبيه', description: 'اختر مديراً وأدخل مبلغاً صالحاً (> 0)' });
      return;
    }
    startTransition(async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/pm-budgets`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, amount: n, date })
        });
        if (!res.ok) throw new Error();
        show({ variant: 'success', title: 'تم', description: 'تمت إضافة المخصص' });
        setAmount('');
  // keep selected date (user might add multiple allocations same date)
  if (onSuccess) onSuccess();
  // trigger server component re-fetch
  router.refresh();
      } catch {
        show({ variant: 'destructive', title: 'خطأ', description: 'فشل إضافة المخصص' });
      }
    });
  };

  return (
    <div className="grid sm:grid-cols-5 gap-2 items-end">
      <div className="sm:col-span-2">
        <label className="block text-xs mb-1">المدير</label>
        <select
          className="w-full h-10 rounded-[10px] border border-[var(--glass-border)] bg-[var(--glass-bg)] px-2 text-sm"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        >
          <option value="">— اختر —</option>
          {pmUsers.map((u) => (
            <option key={u.id} value={u.id}>{u.username}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs mb-1">المبلغ</label>
        <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
      </div>
      <div className="sm:col-span-2">
        <label className="block text-xs mb-1">التاريخ</label>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div className="sm:col-span-5">
        <Button disabled={isPending} onClick={submit} size="sm">{isPending ? 'جارٍ...' : 'إضافة مخصص'}</Button>
      </div>
    </div>
  );
}
