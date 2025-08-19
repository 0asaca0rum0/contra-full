"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AddWarehouseItemForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('0');
  const [submitting, setSubmitting] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/warehouse/items', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: name.trim(), quantity: Number(quantity)||0 }) });
      if (res.ok) {
        setName('');
        setQuantity('0');
        router.refresh();
      }
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <form onSubmit={submit} className="flex flex-wrap gap-3 items-end">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-600">اسم الصنف</label>
        <input value={name} onChange={e=>setName(e.target.value)} className="border rounded px-2 py-1 text-sm w-52" placeholder="مثال: مسمار" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-600">الكمية الابتدائية</label>
        <input type="number" value={quantity} onChange={e=>setQuantity(e.target.value)} className="border rounded px-2 py-1 text-sm w-32" />
      </div>
      <button disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded px-4 py-2 text-sm">
        {submitting ? '...' : 'إضافة'}
      </button>
    </form>
  );
}
