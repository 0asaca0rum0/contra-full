"use client";
import { useState, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';

interface Employee { id: string; name: string; }
interface AttendanceRec { employee_id: string; present?: boolean; status?: string; state?: string; }
interface Props { employees: Employee[]; attendance?: AttendanceRec[]; date?: string; }

export default function AttendanceControls({ employees, attendance, date }: Props) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Build quick lookup of employees already marked today
  const markedMap = useMemo(() => {
    const map = new Map<string, AttendanceRec>();
    (attendance || []).forEach(r => {
      if (r.employee_id) map.set(String(r.employee_id), r);
    });
    return map;
  }, [attendance]);

  const summary = useMemo(() => {
    let present = 0; let absent = 0;
    markedMap.forEach(r => { if (r.present) present++; else absent++; });
    return { present, absent, total: markedMap.size };
  }, [markedMap]);

  async function mark(empId: string, present: boolean) {
    setPendingId(empId);
    setError(null);
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ employeeId: empId, present, date })
      });
      if (!res.ok) {
        const j = await res.json().catch(()=>({}));
        throw new Error(j.error || 'Failed');
      }
      startTransition(()=>router.refresh());
    } catch (e: any) {
      setError(e.message || 'Error');
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="mt-4 space-y-3">
      <h3 className="font-medium text-sm flex items-center gap-3">
        <span>تحديث الحضور ({date ? new Date(date).toLocaleDateString('ar') : 'اليوم'})</span>
        {summary.total > 0 && (
          <span className="text-[10px] font-bold flex items-center gap-2">
            <span className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">حاضر: {summary.present}</span>
            <span className="px-2 py-1 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">غائب: {summary.absent}</span>
            <span className="px-2 py-1 rounded-lg bg-slate-700/50 text-slate-300 border border-white/5">الإجمالي: {summary.total}</span>
          </span>
        )}
      </h3>
      {error && <div className="text-[11px] text-rose-600">{error}</div>}
      <ul className="space-y-1">
        {employees.length === 0 && <li className="text-xs text-slate-400">لا يوجد موظفون</li>}
        {employees.map(e => {
          const rec = markedMap.get(e.id);
          const already = !!rec;
          const present = rec?.present ?? (rec?.status === 'present' || rec?.state === 'present');
          return (
            <li key={e.id} className="flex items-center justify-between gap-2 text-sm rounded-2xl px-4 py-3 border border-white/5 bg-slate-800/40 hover:bg-slate-800/60 transition-colors">
              <span className="font-bold text-white truncate flex items-center gap-3">
                {e.name}
                {already && (
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${present ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}>
                    {present ? 'حاضر' : 'غائب'}
                  </span>
                )}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={()=>mark(e.id, true)}
                  disabled={pendingId === e.id || isPending}
                  className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 text-white"
                >حاضر</button>
                <button
                  onClick={()=>mark(e.id, false)}
                  disabled={pendingId === e.id || isPending}
                  className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-500 disabled:bg-slate-300 text-white"
                >غائب</button>
                {already && (
                  <button
                    onClick={()=>mark(e.id, !present)}
                    disabled={pendingId === e.id || isPending}
                    className="px-2 py-1 rounded bg-amber-500 hover:bg-amber-400 disabled:bg-slate-300 text-white"
                    title="تبديل"
                  >تبديل</button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
