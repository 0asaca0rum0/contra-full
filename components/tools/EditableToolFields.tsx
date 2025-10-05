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
    if (!responsiblePmId.trim()) { setError('يجب اختيار مدير مشروع مسؤول'); return; }
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
      <div className="flex flex-col gap-2 w-full">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-slate-800 tracking-tight leading-none break-words flex-1">{name}</h2>
          <button type="button" onClick={start} className="relative z-10 text-[11px] rounded px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white transition-colors">تعديل</button>
        </div>
        <div className="text-xs text-slate-600"><span className="font-medium">المشروع:</span> {displayLocation}</div>
        <div className="text-xs text-slate-600"><span className="font-medium">مدير المشروع المسؤول:</span> {displayResponsiblePm}</div>
        <button
          type="button"
          onClick={remove}
          disabled={deleting}
          className="self-start text-[11px] rounded px-2 py-1 bg-red-100 text-red-700 hover:bg-red-200 transition-colors disabled:opacity-50"
        >
          {deleting ? '...' : 'حذف'}
        </button>
        {error && <div className="text-[11px] text-red-600">{error}</div>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex flex-col md:flex-row gap-2">
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="اسم الأداة" className="flex-1 rounded border border-slate-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40" />
        {hasProjects ? (
          <select
            value={location}
            onChange={e=>setLocation(e.target.value)}
            className="flex-1 rounded border border-slate-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 bg-white"
          >
            <option value="">اختر مشروعاً</option>
            {!projectMap.has(location) && location && (
              <option value={location}>{projectMap.get(location) ?? location}</option>
            )}
            {projectOptions.map(project => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>
        ) : (
          <div className="flex-1 rounded border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-700">
            لا توجد مشاريع متاحة حالياً.
          </div>
        )}
      </div>
      <div className="flex flex-col md:flex-row gap-2">
        <div className="flex-1" />
        {hasManagers ? (
          <select
            value={responsiblePmId}
            onChange={e=>setResponsiblePmId(e.target.value)}
            className="flex-1 rounded border border-slate-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 bg-white"
          >
            <option value="">اختر مديراً</option>
            {currentProjectManagers.map((pm) => (
              <option key={pm.id} value={pm.id}>{pm.name}</option>
            ))}
          </select>
        ) : (
          <div className="flex-1 rounded border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-700">
            لا يوجد مدراء مشروع مرتبطون بهذا المشروع.
          </div>
        )}
      </div>
      {error && <div className="text-[11px] text-red-600">{error}</div>}
      <div className="flex gap-2">
        <button onClick={save} disabled={saving} className="text-[12px] px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50">{saving ? '...' : 'حفظ'}</button>
        <button onClick={cancel} disabled={saving} className="text-[12px] px-3 py-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-700">إلغاء</button>
        <button onClick={remove} type="button" disabled={deleting || saving} className="text-[12px] px-3 py-1 rounded bg-red-100 hover:bg-red-200 text-red-700 disabled:opacity-50">{deleting ? '...' : 'حذف'}</button>
      </div>
    </div>
  );
}
