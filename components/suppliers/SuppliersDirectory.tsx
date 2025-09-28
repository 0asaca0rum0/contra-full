"use client";
import React, { useMemo, useState } from 'react';
import { FaMagnifyingGlass, FaSquare, FaList, FaArrowRotateRight } from 'react-icons/fa6';
import Identicon from '@/components/ui/Identicon';
import Link from 'next/link';

export interface SupplierSummary {
  id: string;
  name: string;
  balance: number;
  spent: number;
  transactionsCount: number;
  lastTransaction: string | null;
}

interface Props { suppliers: SupplierSummary[]; }

export default function SuppliersDirectory({ suppliers }: Props) {
  const [q, setQ] = useState('');
  const [view, setView] = useState<'cards'|'list'>('cards');
  const [showZero, setShowZero] = useState(true);

  const numberFormatter = useMemo(() => new Intl.NumberFormat('en-US'), []);
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }),
    []
  );

  const formatNumber = (value: number) => numberFormatter.format(value ?? 0);

  const filtered = useMemo(() => {
    return suppliers.filter(s => {
      if (!showZero && s.transactionsCount === 0) return false;
      if (!q.trim()) return true;
      return s.name.toLowerCase().includes(q.toLowerCase()) || s.id.includes(q);
    });
  }, [q, showZero, suppliers]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[240px] flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5">
          <FaMagnifyingGlass className="text-slate-400 text-[13px]" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="بحث بالاسم أو المعرف" className="flex-1 bg-transparent outline-none text-sm" />
          {q && <button onClick={() => setQ('')} className="text-[11px] text-slate-400 hover:text-rose-600">مسح</button>}
        </div>
        <div className="flex items-center gap-2 text-[11px] font-medium">
          <label className="flex items-center gap-1 cursor-pointer select-none">
            <input type="checkbox" className="accent-emerald-600" checked={showZero} onChange={e => setShowZero(e.target.checked)} />
            <span>إظهار بدون عمليات</span>
          </label>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setView('cards')} className={`px-3 py-1.5 text-xs rounded-md border ${view==='cards'?'bg-emerald-600 text-white border-emerald-600':'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}><FaSquare /></button>
          <button onClick={() => setView('list')} className={`px-3 py-1.5 text-xs rounded-md border ${view==='list'?'bg-emerald-600 text-white border-emerald-600':'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}><FaList /></button>
          <button onClick={() => { setQ(''); setShowZero(true); }} className="px-3 py-1.5 text-xs rounded-md border bg-white text-slate-600 border-slate-200 hover:bg-slate-50"><FaArrowRotateRight /></button>
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-slate-500 text-sm">لا توجد نتائج مطابقة</div>
      )}

      {view === 'cards' && filtered.length > 0 && (
        <div className={`grid gap-7 ${filtered.length>1 ? 'sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4':'grid-cols-1'}`}>
          {filtered.map(s => {
            const last = s.lastTransaction ? dateFormatter.format(new Date(s.lastTransaction)) : '-';
            const status = s.balance === 0 ? 'متزن' : (s.balance > 0 ? 'ندين' : 'دائن لنا');
            return (
              <Link key={s.id} href={`/suppliers/${s.id}`} className="group relative flex flex-col gap-5 rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 px-7 pt-6 pb-7 hover:shadow-xl shadow transition-all overflow-hidden focus:outline-none focus:ring-2 focus:ring-emerald-500/50">
                <div className="flex items-start gap-5">
                  <Identicon seed={s.id} size={58} />
                  <div className="flex-1 min-w-0 space-y-3">
                    <h2 className="text-lg font-bold text-slate-800 tracking-tight leading-snug break-words group-hover:text-emerald-600 transition-colors">{s.name}</h2>
                    <div className="flex flex-wrap gap-2 text-[10px]">
                      <span className={`px-2 py-1 rounded-full font-semibold ${s.balance>0?'bg-amber-100 text-amber-700':s.balance<0?'bg-rose-100 text-rose-600':'bg-slate-200 text-slate-600'}`}>{status}</span>
                      <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-600 font-mono">{formatNumber(s.transactionsCount)} عمليات</span>
                      {s.spent>0 && <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 font-mono">مدفوع {formatNumber(s.spent)}</span>}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 grid-rows-2 gap-1 text-center">
                  <Metric label="الرصيد" value={formatNumber(s.balance)} tone={s.balance<0? 'rose':'slate'} />
                  <Metric label="المدفوع" value={formatNumber(s.spent)} tone="emerald" />
                  <Metric label="العمليات" value={formatNumber(s.transactionsCount)} />
                  <Metric label="آخر" value={last} small />
                </div>
                <div className="absolute inset-0 rounded-2xl ring-1 ring-transparent group-hover:ring-emerald-400/50 transition-colors" />
              </Link>
            );
          })}
        </div>
      )}

      {view === 'list' && filtered.length > 0 && (
        <div className="overflow-auto rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-[11px] text-slate-500">
              <tr className="text-right">
                <th className="font-medium p-2">الاسم</th>
                <th className="font-medium p-2">الرصيد</th>
                <th className="font-medium p-2">المدفوع</th>
                <th className="font-medium p-2">العمليات</th>
                <th className="font-medium p-2">آخر عملية</th>
                <th className="font-medium p-2">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => {
                const last = s.lastTransaction ? dateFormatter.format(new Date(s.lastTransaction)) : '-';
                const status = s.balance === 0 ? 'متزن' : (s.balance > 0 ? 'ندين' : 'دائن لنا');
                return (
                  <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="p-2 font-medium text-slate-700"><Link href={`/suppliers/${s.id}`} className="hover:underline">{s.name}</Link></td>
                    <td className={`p-2 font-mono text-[13px] ${s.balance<0? 'text-rose-600':'text-slate-600'}`}>{formatNumber(s.balance)}</td>
                    <td className="p-2 font-mono text-[13px] text-emerald-700">{formatNumber(s.spent)}</td>
                    <td className="p-2 font-mono text-[12px] text-slate-600">{formatNumber(s.transactionsCount)}</td>
                    <td className="p-2 text-[11px] text-slate-500">{last}</td>
                    <td className="p-2 text-[11px]">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-semibold ${s.balance>0?'bg-amber-100 text-amber-700':s.balance<0?'bg-rose-100 text-rose-600':'bg-slate-200 text-slate-600'}`}>{status}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, tone='slate', small=false }: { label: string; value: any; tone?: 'slate'|'emerald'|'rose'; small?: boolean }) {
  const colorMap: Record<string,string> = {
    slate: 'text-slate-700', emerald: 'text-emerald-600', rose: 'text-rose-600'
  };
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white/70 h-20 ">
      <span className="text-[10px] text-slate-500 mb-2">{label}</span>
      <span className={`font-semibold ${small? 'text-xs':'text-lg'} tracking-tight ${colorMap[tone]}`}>{value}</span>
    </div>
  );
}
