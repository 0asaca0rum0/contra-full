"use client";
import React, { useState, useTransition } from 'react';

interface ProjectOption {
  id: string;
  name: string;
}

export default function AddToolForm({ projects }: { projects: ProjectOption[] }) {
  const [name, setName] = useState('');
  const [projectId, setProjectId] = useState('');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!projectId) {
      setError('يجب اختيار مشروع');
      return;
    }
    const payload = { name, location: projectId };
    startTransition(async () => {
      const res = await fetch('/api/tools', { method: 'POST', body: JSON.stringify(payload), headers: { 'content-type': 'application/json' } });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error || 'فشل التنفيذ');
        return;
      }
      setName('');
      setProjectId('');
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
    <form onSubmit={submit} className="flex gap-2 items-end py-2">
      <div className="flex flex-col">
        <label className="text-xs tracking-wide text-gray-500">اسم الأداة</label>
        <input value={name} onChange={e=>setName(e.target.value)} required className="border rounded px-2 py-1 text-sm" placeholder="مثال: مثقاب" />
      </div>
      <div className="flex flex-col">
        <label className="text-xs tracking-wide text-gray-500">المشروع</label>
        <select
          value={projectId}
          onChange={e=>setProjectId(e.target.value)}
          required
          className="border rounded px-2 py-1 text-sm min-w-[12rem] bg-white"
        >
          <option value="">اختر مشروعاً</option>
          {projects.map(project => (
            <option key={project.id} value={project.id}>{project.name}</option>
          ))}
        </select>
      </div>
      <button disabled={pending} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded text-sm disabled:opacity-50">{pending ? '...' : 'إضافة'}</button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </form>
  );
}
