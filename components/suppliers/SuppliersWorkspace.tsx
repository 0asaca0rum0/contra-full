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
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-700">
            اختر ما إذا كنت ترغب في استعراض الموردين أو إدارة بياناتهم.
          </p>
          <p className="text-[12px] text-slate-500">
            يعتمد كلا الوضعين على نفس البيانات المباشرة، لذلك لن يتم تكرار القوائم أو المستجدات.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode('overview')}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              mode === 'overview'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'bg-white text-emerald-700 border border-emerald-200 hover:border-emerald-300 hover:text-emerald-800'
            }`}
          >
            نظرة عامة
          </button>
          <button
            type="button"
            onClick={() => setMode('manage')}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              mode === 'manage'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'bg-white text-emerald-700 border border-emerald-200 hover:border-emerald-300 hover:text-emerald-800'
            }`}
          >
            إدارة
          </button>
        </div>
      </div>

      {mode === 'overview' ? (
        <SuppliersDirectory suppliers={suppliers} />
      ) : (
        <SupplierManager />
      )}
    </div>
  );
}
