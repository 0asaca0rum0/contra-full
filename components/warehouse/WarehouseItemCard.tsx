"use client";
import React, { useState } from 'react';
import TransactionModal from './TransactionModal';

interface ProjectOption {
  id: string;
  name: string;
  managers: { id: string; name: string }[];
}

interface ItemProps {
  id: string;
  name: string;
  quantity: number;
  imageUrl: string | null;
  projects: ProjectOption[];
}

export default function WarehouseItemCard({ id, name, quantity, imageUrl, projects }: ItemProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [txType, setTxType] = useState<'IN' | 'OUT'>('OUT');

  const openModal = (type: 'IN' | 'OUT') => {
    setTxType(type);
    setModalOpen(true);
  };

  return (
    <>
      <article className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-md group">
        <div className="flex items-start gap-3">
          {/* Image */}
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
            {imageUrl ? (
              <img src={imageUrl} alt={name} className="h-full w-full object-cover" loading="lazy" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-400">بدون صورة</div>
            )}
          </div>
          
          {/* Details */}
          <div className="flex-1 space-y-1 pt-1">
            <h3 className="text-sm font-bold text-slate-800 line-clamp-1" title={name}>{name}</h3>
            <div className="flex items-baseline gap-1.5 text-xs text-slate-500">
              <span>الكمية:</span>
              <span className={`font-mono text-base font-bold ${quantity > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                {quantity}
              </span>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-50 pt-3">
           {/* Quick Actions */}
           <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg">
             <button 
               onClick={() => openModal('OUT')}
               className="w-8 h-8 flex items-center justify-center rounded-md bg-white border border-slate-200 text-rose-600 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 transition-colors shadow-sm"
               title="صرف"
             >
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" /></svg>
             </button>
             <button 
               onClick={() => openModal('IN')}
               className="w-8 h-8 flex items-center justify-center rounded-md bg-white border border-slate-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 transition-colors shadow-sm"
               title="إضافة"
             >
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
             </button>
           </div>

           {imageUrl && (
             <a href={imageUrl} target="_blank" rel="noreferrer" className="text-[10px] font-medium text-slate-400 hover:text-emerald-600 transition-colors">
               عرض الصورة
             </a>
           )}
        </div>
      </article>

      <TransactionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        itemId={id}
        itemName={name}
        currentQuantity={quantity}
        initialType={txType}
        projects={projects}
      />
    </>
  );
}
