"use client";
import React, { useMemo, useState } from 'react';
import { FaMagnifyingGlass, FaList, FaGrip, FaArrowRotateRight, FaFilter } from 'react-icons/fa6';
import Identicon from '@/components/ui/Identicon';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

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
        month: 'short',
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
    <div className="space-y-8">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <FaMagnifyingGlass className="h-4 w-4" />
          </div>
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="بحث عن مورد..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:border-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all"
          />
          {q && (
            <button 
              onClick={() => setQ('')}
              className="absolute inset-y-0 right-2 flex items-center px-2 text-xs font-medium text-slate-400 hover:text-rose-500"
            >
              مسح
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors select-none">
            <input 
              type="checkbox" 
              className="accent-slate-900 h-3.5 w-3.5 rounded border-slate-300" 
              checked={showZero} 
              onChange={e => setShowZero(e.target.checked)} 
            />
            <span>إظهار الخاملين</span>
          </label>

          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-1">
            <button 
              onClick={() => setView('cards')} 
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${view==='cards' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <FaGrip className="h-3.5 w-3.5" />
            </button>
            <button 
              onClick={() => setView('list')} 
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${view==='list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <FaList className="h-3.5 w-3.5" />
            </button>
          </div>

          <button 
            onClick={() => { setQ(''); setShowZero(true); }} 
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition-colors hover:border-slate-300 hover:text-slate-600"
            title="إعادة تعيين"
          >
            <FaArrowRotateRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {filtered.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50/50 py-20 text-center"
          >
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <FaMagnifyingGlass className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700">لا توجد نتائج</h3>
            <p className="text-sm text-slate-500">جرب تغيير مصطلحات البحث أو الفلاتر</p>
          </motion.div>
        ) : view === 'cards' ? (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {filtered.map((s, i) => (
              <SupplierCard key={s.id} supplier={s} index={i} formatNumber={formatNumber} dateFormatter={dateFormatter} />
            ))}
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-right text-xs font-semibold text-slate-500">
                    <th className="px-6 py-4">المورد</th>
                    <th className="px-6 py-4">الرصيد</th>
                    <th className="px-6 py-4">المدفوع</th>
                    <th className="px-6 py-4">العمليات</th>
                    <th className="px-6 py-4">آخر نشاط</th>
                    <th className="px-6 py-4">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((s) => {
                    const status = s.balance === 0 ? 'balanced' : (s.balance > 0 ? 'debt' : 'credit');
                    return (
                      <tr key={s.id} className="group transition-colors hover:bg-slate-50/80">
                        <td className="px-6 py-4">
                          <Link href={`/suppliers/${s.id}`} className="flex items-center gap-3">
                            <Identicon seed={s.id} size={32} className="shrink-0" />
                            <span className="font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">{s.name}</span>
                          </Link>
                        </td>
                        <td className={`px-6 py-4 font-mono font-medium ${s.balance < 0 ? 'text-rose-600' : 'text-slate-600'}`}>
                          {formatNumber(s.balance)}
                        </td>
                        <td className="px-6 py-4 font-mono text-emerald-600">{formatNumber(s.spent)}</td>
                        <td className="px-6 py-4 font-mono text-slate-500">{formatNumber(s.transactionsCount)}</td>
                        <td className="px-6 py-4 text-xs text-slate-500">
                          {s.lastTransaction ? dateFormatter.format(new Date(s.lastTransaction)) : '-'}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SupplierCard({ supplier, index, formatNumber, dateFormatter }: { supplier: SupplierSummary, index: number, formatNumber: (n: number) => string, dateFormatter: Intl.DateTimeFormat }) {
  const status = supplier.balance === 0 ? 'balanced' : (supplier.balance > 0 ? 'debt' : 'credit');
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link 
        href={`/suppliers/${supplier.id}`}
        className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/50"
      >
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Identicon seed={supplier.id} size={48} />
            <div>
              <h3 className="font-bold text-slate-800 line-clamp-1 group-hover:text-slate-600 transition-colors">{supplier.name}</h3>
              <div className="text-xs text-slate-500 font-mono mt-0.5">#{supplier.id.slice(0, 8)}</div>
            </div>
          </div>
          <StatusBadge status={status} />
        </div>

        <div className="mt-auto grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3">
          <div className="space-y-1">
            <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400">الرصيد</div>
            <div className={`font-mono text-sm font-bold ${supplier.balance < 0 ? 'text-rose-600' : 'text-slate-700'}`}>
              {formatNumber(supplier.balance)}
            </div>
          </div>
          <div className="space-y-1 border-r border-slate-200 pr-3">
            <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400">المدفوع</div>
            <div className="font-mono text-sm font-bold text-emerald-600">
              {formatNumber(supplier.spent)}
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
            <span>{formatNumber(supplier.transactionsCount)} عملية</span>
          </div>
          <div>
            {supplier.lastTransaction ? dateFormatter.format(new Date(supplier.lastTransaction)) : 'لا يوجد نشاط'}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function StatusBadge({ status }: { status: 'balanced' | 'debt' | 'credit' }) {
  const styles = {
    balanced: 'bg-slate-100 text-slate-600',
    debt: 'bg-amber-50 text-amber-700 border-amber-100',
    credit: 'bg-rose-50 text-rose-700 border-rose-100'
  };
  
  const labels = {
    balanced: 'متزن',
    debt: 'لنا',
    credit: 'علينا'
  };

  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
