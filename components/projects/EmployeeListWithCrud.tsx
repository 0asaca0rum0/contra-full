"use client";
import { useState } from 'react';

interface Props { employees: Array<{ id: string; name: string }>; projectId: string; }
export default function EmployeeListWithCrud({ employees }: Props) {
  const [items, setItems] = useState(employees);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function rename(id: string) {
    if (!name.trim()) return;
    setLoadingId(id); setError(null);
    try {
      const res = await fetch(`/api/employees?id=${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name.trim() }) });
      if (!res.ok) { const j = await res.json().catch(()=>({})); throw new Error(j.error || 'Failed'); }
      setItems(items.map(i => i.id === id ? { ...i, name: name.trim() } : i));
      setEditingId(null); setName('');
    } catch(e:any){ setError(e.message); } finally { setLoadingId(null); }
  }
  async function remove(id: string) {
    if (!confirm('حذف الموظف؟')) return;
    setLoadingId(id); setError(null);
    try {
      const res = await fetch(`/api/employees?id=${id}`, { method: 'DELETE' });
      if (!res.ok) { const j = await res.json().catch(()=>({})); throw new Error(j.error || 'Failed'); }
      setItems(items.filter(i => i.id !== id));
    } catch(e:any){ setError(e.message); } finally { setLoadingId(null); }
  }

  return (
    <div className="mb-4">
      <ul className="text-sm list-disc pr-5 space-y-1">
        {items.length === 0 && <li className="text-[var(--color-text-secondary)]">لا يوجد موظفون مرتبطون</li>}
        {items.map(e => (
          <li key={e.id} className="flex items-center gap-2">
            {editingId === e.id ? (
              <>
                <input autoFocus value={name} onChange={ev=>setName(ev.target.value)} className="border rounded px-2 py-0.5 text-xs" />
                <button disabled={loadingId===e.id} onClick={()=>rename(e.id)} className="text-[11px] px-2 py-0.5 rounded bg-emerald-600 text-white disabled:bg-slate-300">حفظ</button>
                <button onClick={()=>{setEditingId(null); setName('');}} className="text-[11px] px-2 py-0.5 rounded bg-slate-200">إلغاء</button>
              </>
            ) : (
              <>
                <span>{e.name}</span>
                <button onClick={()=>{setEditingId(e.id); setName(e.name);}} className="text-[11px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200">تعديل</button>
                <button disabled={loadingId===e.id} onClick={()=>remove(e.id)} className="text-[11px] px-2 py-0.5 rounded bg-rose-600 text-white disabled:bg-slate-300">حذف</button>
              </>
            )}
          </li>
        ))}
      </ul>
      {error && <div className="text-[11px] text-rose-600 mt-1">{error}</div>}
    </div>
  );
}
