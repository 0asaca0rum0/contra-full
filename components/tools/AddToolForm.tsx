"use client";
import React, { useState, useTransition } from 'react';

export default function AddToolForm() {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const payload = { name, location };
    startTransition(async () => {
      const res = await fetch('/api/tools', { method: 'POST', body: JSON.stringify(payload), headers: { 'content-type': 'application/json' } });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error || 'فشل التنفيذ');
        return;
      }
      setName('');
      setLocation('');
      window.location.reload();
    });
  };

  return (
    <form onSubmit={submit} className="flex gap-2 items-end py-2">
      <div className="flex flex-col">
        <label className="text-xs tracking-wide text-gray-500">اسم الأداة</label>
        <input value={name} onChange={e=>setName(e.target.value)} required className="border rounded px-2 py-1 text-sm" placeholder="مثال: مثقاب" />
      </div>
      <div className="flex flex-col">
        <label className="text-xs tracking-wide text-gray-500">الموقع</label>
        <input value={location} onChange={e=>setLocation(e.target.value)} required className="border rounded px-2 py-1 text-sm" placeholder="المستودع أ" />
      </div>
      <button disabled={pending} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded text-sm disabled:opacity-50">{pending ? '...' : 'إضافة'}</button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </form>
  );
}
