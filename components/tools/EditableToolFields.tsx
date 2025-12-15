"use client";
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

interface ProjectOption {
  id: string;
  name: string;
  managers: { id: string; name: string }[];
}

interface Props {
  id: string;
  nameInitial: string;
  locationInitial: string;
  projectOptions: ProjectOption[];
  locationLabel?: string;
  responsiblePmIdInitial?: string;
  responsiblePmName?: string;
}

export default function EditableToolFields({ id, nameInitial, locationInitial, projectOptions, locationLabel, responsiblePmIdInitial, responsiblePmName }: Props) {
  const router = useRouter();
  const [name, setName] = useState(nameInitial);
  const [location, setLocation] = useState(locationInitial);
  const [responsiblePmId, setResponsiblePmId] = useState(responsiblePmIdInitial ?? '');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(nameInitial);
  }, [nameInitial]);

  useEffect(() => {
    setLocation(locationInitial);
  }, [locationInitial]);

  useEffect(() => {
    setResponsiblePmId(responsiblePmIdInitial ?? '');
  }, [responsiblePmIdInitial]);

  const projectMap = useMemo(() => new Map(projectOptions.map((p) => [p.id, p.name])), [projectOptions]);
  const pmMap = useMemo(() => {
    const entries: [string, string][] = [];
    projectOptions.forEach((project) => {
      project.managers.forEach((pm) => entries.push([pm.id, pm.name]));
    });
    return new Map(entries);
  }, [projectOptions]);
  const currentProjectManagers = useMemo(() => projectOptions.find((p) => p.id === location)?.managers ?? [], [projectOptions, location]);

  useEffect(() => {
    if (!currentProjectManagers.some((pm) => pm.id === responsiblePmId)) {
      setResponsiblePmId('');
    }
  }, [currentProjectManagers, responsiblePmId]);

  const resolvedLocationLabel = projectMap.get(locationInitial) ?? locationLabel ?? locationInitial;
  const displayLocation = resolvedLocationLabel ? resolvedLocationLabel : '—';
  const displayResponsiblePm = responsiblePmId
    ? (pmMap.get(responsiblePmId) ?? responsiblePmName ?? responsiblePmId)
    : '—';
  const hasProjects = projectOptions.length > 0;
  const hasManagers = currentProjectManagers.length > 0;

  const start = () => { setEditing(true); setError(null); };
  const cancel = () => {
    setEditing(false);
    setName(nameInitial);
    setLocation(locationInitial);
    setResponsiblePmId(responsiblePmIdInitial ?? '');
    setError(null);
  };

  async function save() {
    if (saving) return;
    if (!name.trim()) { setError('الاسم مطلوب'); return; }
    if (!location.trim()) { setError('يجب اختيار مشروع'); return; }
    // responsiblePmId is now optional
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/tools/${id}`, { method: 'PATCH', body: JSON.stringify({ name, location, responsiblePmId }), headers: { 'content-type': 'application/json' } });
      if (!res.ok) {
        const j = await res.json().catch(()=>({}));
        setError(j.error || 'فشل الحفظ');
        return;
      }
      setEditing(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const remove = useCallback(async () => {
    if (deleting) return;
    if (typeof window !== 'undefined') {
      const confirmed = window.confirm('هل تريد حذف هذه الأداة؟');
      if (!confirmed) return;
    }
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/tools/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const j = await res.json().catch(()=>({}));
        setError(j.error || 'فشل الحذف');
        return;
      }
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }, [deleting, id, router]);

  if (!editing) {
    return (
      <div className="flex flex-col h-full relative z-10">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" /></svg>
          </div>
          <button type="button" onClick={start} className="text-slate-400 hover:text-emerald-600 transition-colors p-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
          </button>
        </div>
        
        <h2 className="text-lg font-bold text-slate-800 tracking-tight mb-1">{name}</h2>
        <div className="space-y-2 mt-auto pt-4">
          <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded-md border border-slate-100">
            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            <span className="font-medium text-slate-700">{displayLocation}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded-md border border-slate-100">
            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            <span className="font-medium text-slate-700">{displayResponsiblePm}</span>
          </div>
        </div>

        {error && <div className="text-[11px] text-red-600 mt-2 bg-red-50 p-2 rounded">{error}</div>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 w-full h-full relative z-10">
      <div className="mb-2">
        <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1 block">اسم الأداة</label>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="اسم الأداة" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-semibold text-slate-800 placeholder:text-slate-300" />
      </div>

      <div className="space-y-3">
        <div>
           <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1 block">المشروع</label>
           {hasProjects ? (
            <div className="relative">
              <select
                value={location}
                onChange={e=>setLocation(e.target.value)}
                className="w-full appearance-none rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white transition-all text-slate-700 cursor-pointer"
              >
                <option value="">اختر مشروعاً</option>
                {!projectMap.has(location) && location && (
                  <option value={location}>{projectMap.get(location) ?? location}</option>
                )}
                {projectOptions.map(project => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          ) : (
            <div className="w-full rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 font-medium">
              لا توجد مشاريع متاحة
            </div>
          )}
        </div>

        <div>
           <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1 block">المسؤول</label>
           <div className="relative">
            <select
              value={responsiblePmId}
              onChange={e=>setResponsiblePmId(e.target.value)}
              disabled={!hasManagers}
              className="w-full appearance-none rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white disabled:bg-slate-50 disabled:text-slate-400 transition-all text-slate-700 cursor-pointer"
            >
              <option value="">{hasManagers ? 'اختر مديراً (اختياري)' : 'لا يوجد مدراء'}</option>
              {currentProjectManagers.map((pm) => (
                <option key={pm.id} value={pm.id}>{pm.name}</option>
              ))}
            </select>
             <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
          </div>
        </div>
      </div>

      {error && <div className="text-[11px] text-red-600 bg-red-50 p-2 rounded font-medium">{error}</div>}
      
      <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
        <button onClick={save} disabled={saving} className="flex-1 text-[13px] px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:shadow-none">{saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}</button>
        <button onClick={cancel} disabled={saving} className="text-[13px] px-3 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium transition-colors">إلغاء</button>
        <button onClick={remove} type="button" disabled={deleting || saving} className="text-[13px] px-3 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 font-medium transition-colors disabled:opacity-50 ml-auto" title="حذف الأداة">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>
      </div>
    </div>
  );
}
