"use client";
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  projectId: string;
}

export default function AddEmployeeForm({ projectId }: Props) {
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), projectId })
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Failed');
      }
      setName("");
      router.refresh();
    } catch (e: any) {
      setError(e.message || 'Error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-2 max-w-xs">
      <label className="text-[12px] font-medium text-slate-600">اسم الموظف</label>
      <input
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="أدخل الاسم"
        className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
        disabled={submitting}
      />
      {error && <div className="text-[11px] text-rose-600">{error}</div>}
      <button
        type="submit"
        disabled={submitting || !name.trim()}
        className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 text-white text-sm font-medium px-4 py-2 transition-colors"
      >
        {submitting ? '...جارٍ الحفظ' : 'إضافة'}
      </button>
    </form>
  );
}
