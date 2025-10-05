"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

interface ProjectOption {
  id: string;
  name: string;
}

interface Props {
  id: string;
  nameInitial: string;
  locationInitial: string;
  projectOptions: ProjectOption[];
  locationLabel?: string;
}

export default function EditableToolFields({ id, nameInitial, locationInitial, projectOptions, locationLabel }: Props) {
  const router = useRouter();
  const [name, setName] = useState(nameInitial);
  const [location, setLocation] = useState(locationInitial);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(nameInitial);
  }, [nameInitial]);

  useEffect(() => {
    setLocation(locationInitial);
  }, [locationInitial]);

  const projectMap = useMemo(() => new Map(projectOptions.map((p) => [p.id, p.name])), [projectOptions]);
  const resolvedLocationLabel = projectMap.get(locationInitial) ?? locationLabel ?? locationInitial;
  const displayLocation = resolvedLocationLabel ? resolvedLocationLabel : '—';
  const hasProjects = projectOptions.length > 0;

  const start = () => { setEditing(true); setError(null); };
  const cancel = () => { setEditing(false); setName(nameInitial); setLocation(locationInitial); };

  async function save() {
    if (saving) return;
    if (!name.trim()) { setError('الاسم مطلوب'); return; }
    if (!location.trim()) { setError('يجب اختيار مشروع'); return; }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/tools/${id}`, { method: 'PATCH', body: JSON.stringify({ name, location }), headers: { 'content-type': 'application/json' } });
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

  if (!editing) {
    return (
      <div className="flex flex-col gap-2 w-full">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-slate-800 tracking-tight leading-none break-words flex-1">{name}</h2>
          <button type="button" onClick={start} className="relative z-10 text-[11px] rounded px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white transition-colors">تعديل</button>
        </div>
  <div className="text-xs text-slate-600"><span className="font-medium">المشروع:</span> {displayLocation}</div>
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
      {error && <div className="text-[11px] text-red-600">{error}</div>}
      <div className="flex gap-2">
        <button onClick={save} disabled={saving} className="text-[12px] px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50">{saving ? '...' : 'حفظ'}</button>
        <button onClick={cancel} disabled={saving} className="text-[12px] px-3 py-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-700">إلغاء</button>
      </div>
    </div>
  );
}
