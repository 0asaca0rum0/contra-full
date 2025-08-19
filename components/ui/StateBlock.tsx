"use client";
import React from 'react';

interface Props {
  loading?: boolean;
  error?: string | null;
  empty?: boolean;
  emptyLabel?: string;
  children?: React.ReactNode;
  retry?: () => void;
  className?: string;
}

export default function StateBlock({ loading, error, empty, emptyLabel = 'لا توجد بيانات', children, retry, className = '' }: Props) {
  if (loading) return <div className={`text-xs text-slate-500 ${className}`}>...تحميل</div>;
  if (error) return <div className={`text-xs text-rose-600 space-x-2 flex items-center ${className}`}>
    <span>خطأ: {error}</span>
    {retry && <button onClick={retry} className="underline text-emerald-600">إعادة</button>}
  </div>;
  if (empty) return <div className={`text-xs text-slate-400 ${className}`}>{emptyLabel}</div>;
  return <>{children}</>;
}
