"use client";
import React, { useState } from 'react';

export default function DeleteTxButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false);
  async function del() {
    if (loading) return;
    if (!confirm('Delete this transaction?')) return;
    setLoading(true);
    try {
      await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
      if (typeof window !== 'undefined') window.location.reload();
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  }
  return (
    <button type="button" onClick={del} className="text-red-600 text-[11px] hover:underline disabled:opacity-50" disabled={loading}>
      {loading ? '...' : 'حذف'}
    </button>
  );
}
