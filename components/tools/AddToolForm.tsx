"use client";
import React, { useMemo, useState, useTransition } from 'react';

interface ProjectOption {
  id: string;
  name: string;
  managers: { id: string; name: string }[];
}

export default function AddToolForm({ projects }: { projects: ProjectOption[] }) {
  const [name, setName] = useState('');
  const [projectId, setProjectId] = useState('');
  const [pmId, setPmId] = useState('');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const projectManagers = useMemo(() => {
    return projects.find((p) => p.id === projectId)?.managers ?? [];
  }, [projects, projectId]);

  React.useEffect(() => {
    if (!projectManagers.some((pm) => pm.id === pmId)) {
      setPmId('');
    }
  }, [projectManagers, pmId]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!projectId) {
      setError('يجب اختيار مشروع');
      return;
    }
    // if (projectManagers.length === 0) {
    //   setError('لا يوجد مدير مشروع مرتبط بهذا المشروع');
    //   return;
    // }
    if (projectManagers.length === 0) {
      // It's acceptable to have no managers now, just warning or optional
      // But if user wants to enforce "No managers -> Error" maybe? 
      // User said "not show the error of a pm update".
      // Assuming optional.
    }
    // PM is optional now
    const payload = { name, location: projectId, responsiblePmId: pmId };
    startTransition(async () => {
      const res = await fetch('/api/tools', { method: 'POST', body: JSON.stringify(payload), headers: { 'content-type': 'application/json' } });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error || 'فشل التنفيذ');
        return;
      }
      setName('');
      setProjectId('');
      setPmId('');
      window.location.reload();
    });
  };

  if (projects.length === 0) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
        لا يمكن إضافة أداة حالياً لأنه لا يوجد أي مشروع. أنشئ مشروعاً جديداً ثم حاول مرة أخرى.
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col md:flex-row gap-4 items-end bg-slate-50/50 p-4 rounded-xl border border-dashed border-slate-300 hover:border-emerald-400/50 hover:bg-emerald-50/30 transition-all group focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500">
      <div className="flex-1 w-full relative">
        <label className="text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-1.5 block">اسم الأداة</label>
        <div className="relative">
          <input value={name} onChange={e=>setName(e.target.value)} required className="w-full rounded-lg border border-slate-200 pl-4 pr-10 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-0 transition-all placeholder:text-slate-300 bg-white font-medium text-slate-700" placeholder="مثال: مثقاب هيلتي" />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" /></svg>
          </div>
        </div>
      </div>
      
      <div className="flex-1 w-full min-w-[200px]">
        <label className="text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-1.5 block">المشروع</label>
        <div className="relative">
          <select
            value={projectId}
            onChange={e=>setProjectId(e.target.value)}
            required
            className="w-full appearance-none rounded-lg border border-slate-200 pl-4 pr-10 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-0 transition-all bg-white font-medium text-slate-700 cursor-pointer"
          >
            <option value="">اختر مشروعاً</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full min-w-[200px]">
        <label className="text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-1.5 block">المدير المسؤول</label>
        <div className="relative">
          <select
            value={pmId}
            onChange={e=>setPmId(e.target.value)}
            disabled={projectManagers.length === 0}
            className="w-full appearance-none rounded-lg border border-slate-200 pl-4 pr-10 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-0 transition-all bg-white disabled:bg-slate-100 disabled:text-slate-400 font-medium text-slate-700 cursor-pointer"
          >
            <option value="">{projectManagers.length === 0 ? 'لا يوجد مدراء' : 'اختر مديراً (اختياري)'}</option>
            {projectManagers.map((pm) => (
              <option key={pm.id} value={pm.id}>{pm.name}</option>
            ))}
          </select>
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </div>
        </div>
      </div>

      <button disabled={pending} className="h-[42px] px-6 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all text-sm font-bold flex items-center justify-center gap-2 min-w-[120px] disabled:opacity-70 disabled:hover:shadow-sm disabled:hover:translate-y-0">
        {pending ? (
          <><svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> جاري الإضافة</>
        ) : (
          <><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg> إضافة</>
        )}
      </button>
      
      {error && <div className="absolute -bottom-6 right-0 text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded">{error}</div>}
    </form>
  );
}
