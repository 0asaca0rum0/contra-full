"use client";
import { useState } from 'react';
import SupplierManager from '@/components/suppliers/SupplierManager';
import SuppliersDirectory, { SupplierSummary } from '@/components/suppliers/SuppliersDirectory';

type Mode = 'overview' | 'manage';

type Props = {
  suppliers: SupplierSummary[];
};

export default function SuppliersWorkspace({ suppliers }: Props) {
  const [mode, setMode] = useState<Mode>('overview');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center rounded-2xl border border-slate-100 bg-slate-50/50 p-1.5 w-fit mx-auto">
        <button
          type="button"
          onClick={() => setMode('overview')}
          className={`rounded-xl px-6 py-2.5 text-sm font-bold transition-all ${
            mode === 'overview'
              ? 'bg-white text-slate-900 shadow-sm ring-1 ring-black/5'
              : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
          }`}
        >
          نظرة عامة
        </button>
        <button
          type="button"
          onClick={() => setMode('manage')}
          className={`rounded-xl px-6 py-2.5 text-sm font-bold transition-all ${
            mode === 'manage'
              ? 'bg-white text-slate-900 shadow-sm ring-1 ring-black/5'
              : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
          }`}
        >
          إدارة
        </button>
      </div>

      {mode === 'overview' ? (
        <SuppliersDirectory suppliers={suppliers} />
      ) : (
        <SupplierManager />
      )}
    </div>
  );
}
