"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  id: string;
  nameInitial: string;
  locationInitial: string;
}

export default function EditableToolFields({ id, nameInitial, locationInitial }: Props) {
  const router = useRouter();
  const [name, setName] = useState(nameInitial);
  const [location, setLocation] = useState(locationInitial);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = () => { setEditing(true); setError(null); };
  const cancel = () => { setEditing(false); setName(nameInitial); setLocation(locationInitial); };

  async function save() {
    if (saving) return;
    if (!name.trim()) { setError('الاسم مطلوب'); return; }
    if (!location.trim()) { setError('الموقع مطلوب'); return; }
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
        <div className="text-xs text-slate-600"><span className="font-medium">الموقع:</span> {location || '—'}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex flex-col md:flex-row gap-2">
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="اسم الأداة" className="flex-1 rounded border border-slate-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40" />
        <input value={location} onChange={e=>setLocation(e.target.value)} placeholder="الموقع" className="flex-1 rounded border border-slate-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40" />
      </div>
      {error && <div className="text-[11px] text-red-600">{error}</div>}
      <div className="flex gap-2">
        <button onClick={save} disabled={saving} className="text-[12px] px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50">{saving ? '...' : 'حفظ'}</button>
        <button onClick={cancel} disabled={saving} className="text-[12px] px-3 py-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-700">إلغاء</button>
      </div>
    </div>
  );
}
