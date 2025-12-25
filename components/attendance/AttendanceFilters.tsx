'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { FaCalendarAlt } from 'react-icons/fa';
import SectionCard from '@/components/ui/SectionCard';

interface Props {
  projects: Array<{ id: string; name: string }>;
  selectedProjectId: string;
  dateStr: string;
}

export default function AttendanceFilters({ projects, selectedProjectId, dateStr }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilters = (newProjectId?: string, newDate?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newProjectId !== undefined) {
      if (newProjectId) params.set('projectId', newProjectId);
      else params.delete('projectId');
    }
    if (newDate !== undefined) {
      params.set('date', newDate);
    }
    router.push(`/attendance?${params.toString()}`);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2 flex flex-wrap gap-4 items-end bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
        <div className="flex-1 min-w-[200px] space-y-2">
          <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest ml-1">تصفية حسب المشروع</label>
          <select 
            value={selectedProjectId}
            onChange={(e) => updateFilters(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-900 text-sm font-bold focus:ring-emerald-500 focus:border-emerald-500 transition-all"
          >
            <option value="">كل المشاريع</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[200px] space-y-2">
          <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest ml-1">اختر التاريخ</label>
          <input 
            type="date" 
            value={dateStr}
            onChange={(e) => updateFilters(undefined, e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-900 text-sm font-bold focus:ring-emerald-500 focus:border-emerald-500 transition-all"
          />
        </div>
      </div>

      <SectionCard variant="light" className="!bg-slate-50 !border-slate-100">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 border border-emerald-400">
            <FaCalendarAlt className="h-6 w-6" />
          </div>
          <div>
            <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">التاريخ المحدد</div>
            <div className="text-xl font-black text-slate-900">
              {new Date(dateStr).toLocaleDateString('ar-DZ', { dateStyle: 'long' })}
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
