"use client";
import React, { useState } from 'react';

export default function EditableToolLocation({ id, initial }: { id: string; initial: string }) {
  const [value, setValue] = useState(initial || '');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = () => { setEditing(true); setError(null); };
  const cancel = () => { setEditing(false); setValue(initial); };

  async function save() {
    if (saving) return;
    if (!value.trim()) { setError('الموقع مطلوب'); return; }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/tools/${id}`, { method: 'PATCH', body: JSON.stringify({ location: value }), headers: { 'content-type': 'application/json' } });
      if (!res.ok) {
        const j = await res.json().catch(()=>({}));
        setError(j.error || 'فشل');
        return;
      }
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <button type="button" onClick={start} className="font-semibold text-slate-700 text-sm leading-none break-words text-center px-1 hover:underline">
        {value || '—'}
      </button>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1 w-full">
      <input value={value} onChange={e=>setValue(e.target.value)} className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/40" />
      <div className="flex gap-1">
        <button onClick={save} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded px-2 py-0.5 text-[11px]">{saving ? '...' : 'حفظ'}</button>
        <button onClick={cancel} disabled={saving} className="bg-slate-200 hover:bg-slate-300 rounded px-2 py-0.5 text-[11px]">إلغاء</button>
      </div>
      {error && <span className="text-[10px] text-red-600">{error}</span>}
    </div>
  );
}
