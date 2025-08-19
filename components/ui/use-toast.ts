"use client";
import { createContext, useContext, useState, ReactNode, createElement } from 'react';

export type Toast = {
  id?: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success' | 'warning';
  duration?: number;
};

type ToastContextValue = {
  toasts: Toast[];
  show: (t: Toast) => void;
  remove: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = (t: Toast) => {
    const id = t.id || Math.random().toString(36).slice(2);
    const toast = { ...t, id } as Toast;
    setToasts((prev) => [...prev, toast]);
    const duration = t.duration ?? 3000;
    if (duration > 0) {
      setTimeout(() => remove(id), duration);
    }
  };

  const remove = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return createElement(ToastContext.Provider, { value: { toasts, show, remove } }, children);
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
