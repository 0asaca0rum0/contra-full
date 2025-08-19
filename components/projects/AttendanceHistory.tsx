"use client";
import { useState, useEffect } from 'react';
import StateBlock from '@/components/ui/StateBlock';

interface Props { projectId: string; }

interface DayRow { day: string; present: number; total: number; }

export default function AttendanceHistory({ projectId }: Props) {
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');
  const [rows, setRows] = useState<DayRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams();
      params.set('groupBy', 'day');
      params.set('projectId', projectId);
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      const res = await fetch(`/api/reports/attendance?${params.toString()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('فشل الجلب');
      const j = await res.json();
      setRows(j.rows || []);
    } catch (e: any) {
      setError(e.message || 'خطأ');
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []); // initial

  const presentTotal = rows.reduce((a,r)=>a+Number(r.present||0),0);
  const totalMarks = rows.reduce((a,r)=>a+Number(r.total||0),0);

  return (
    <div className="space-y-3 mt-4">
      <div className="flex flex-wrap items-end gap-2 text-xs">
        <label className="flex flex-col">من
          <input type="date" value={from} onChange={e=>setFrom(e.target.value)} className="border rounded px-2 py-1" />
        </label>
        <label className="flex flex-col">إلى
          <input type="date" value={to} onChange={e=>setTo(e.target.value)} className="border rounded px-2 py-1" />
        </label>
        <button onClick={load} className="px-3 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-500">عرض</button>
      </div>
      <StateBlock loading={loading} error={error} empty={!loading && !error && rows.length===0} emptyLabel="لا توجد سجلات ضمن النطاق">
        <div className="text-[11px] text-slate-600 flex gap-3">
          <span>مجموع الحضور: {presentTotal}</span>
          <span>إجمالي العلامات: {totalMarks}</span>
          {totalMarks > 0 && <span>النسبة: {((presentTotal/totalMarks)*100).toFixed(1)}%</span>}
        </div>
        <ul className="text-xs divide-y border rounded bg-white mt-2">
          {rows.map(r => (
            <li key={r.day} className="flex items-center justify-between px-2 py-1">
              <span>{new Date(r.day).toLocaleDateString('ar')}</span>
              <span className="flex items-center gap-2">
                <span className="text-emerald-700 font-medium">{r.present}</span>
                <span className="text-slate-400">/</span>
                <span className="font-semibold">{r.total}</span>
              </span>
            </li>
          ))}
        </ul>
      </StateBlock>
    </div>
  );
}
