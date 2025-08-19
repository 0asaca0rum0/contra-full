"use client";
import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react';

export type Toast = {
  id?: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success' | 'warning';
  duration?: number; // ms; 0 = persistent
};

type ToastContextValue = {
  toasts: Toast[];
  show: (t: Toast) => void;
  remove: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const show = (t: Toast) => {
    const id = t.id || Math.random().toString(36).slice(2);
    const toast = { ...t, id } as Toast;
    setToasts((prev) => [...prev, toast]);
    const duration = t.duration ?? 3000;
    if (duration > 0) setTimeout(() => remove(id), duration);
  };

  const value = useMemo(() => ({ toasts, show, remove }), [toasts]);
  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

function variantClasses(variant?: Toast['variant']) {
  switch (variant) {
    case 'destructive':
      return 'bg-[var(--color-error)] text-white';
    case 'success':
      return 'bg-[var(--color-primary)] text-white';
    case 'warning':
      return 'bg-[var(--color-secondary)] text-[var(--color-text)]';
    default:
      return 'glass-card text-[var(--color-text)]';
  }
}

export function Toaster() {
  const { toasts, remove } = useToast();
  return (
    <div className="fixed top-4 left-4 z-50 space-y-3 rtl:left-auto rtl:right-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`min-w-[260px] max-w-[360px] rounded-[12px] px-4 py-3 shadow ${variantClasses(t.variant)} border border-white/40 animate-in fade-in slide-in-from-top-2`}
          role="status"
        >
          <div className="flex items-start gap-3">
            <div className="flex-1">
              {t.title && <div className="font-medium">{t.title}</div>}
              {t.description && <div className="text-sm opacity-90">{t.description}</div>}
            </div>
            <button
              onClick={() => remove(t.id!)}
              className="text-sm opacity-70 hover:opacity-100"
              aria-label="إغلاق"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
