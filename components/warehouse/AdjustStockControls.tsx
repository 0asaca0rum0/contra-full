"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdjustStockControls({ itemId }: { itemId: string }) {
  const router = useRouter();
  const [qty, setQty] = useState('');
  const [loading, setLoading] = useState(false);
  async function submit(sign: 1 | -1) {
    const n = Number(qty) * sign;
    if (!Number.isFinite(n) || n === 0) return;
    setLoading(true);
    try {
      // For now require manual project/user selection later; placeholder projectId/userId will be set via prompt
      const projectId = prompt('Project ID?');
      const userId = prompt('User ID?');
      if (!projectId || !userId) return;
      const res = await fetch('/api/warehouse/transactions', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ itemId, projectId, userId, quantity: n }) });
      if (res.ok) {
        setQty('');
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="flex items-center gap-2">
      <input type="number" value={qty} onChange={e=>setQty(e.target.value)} className="border rounded px-2 py-1 text-xs w-20" placeholder="عدد" />
      <button disabled={loading} onClick={()=>submit(1)} className="text-xs px-2 py-1 rounded bg-emerald-600 text-white disabled:opacity-50">+</button>
      <button disabled={loading} onClick={()=>submit(-1)} className="text-xs px-2 py-1 rounded bg-rose-600 text-white disabled:opacity-50">-</button>
    </div>
  );
}
