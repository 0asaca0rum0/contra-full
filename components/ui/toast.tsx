"use client";
// Deprecated local toast system. Replaced by Sonner.
import { toast as sonnerToast } from 'sonner';

export type Toast = {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success' | 'warning';
  duration?: number;
};

export function useToast() {
  return {
    show: ({ title, description, variant, duration }: Toast) => {
      const content = title || description || '';
      const opts: any = {};
      if (description && title) opts.description = description;
      if (duration != null) opts.duration = duration;
      // Map variants to Sonner styles
      if (variant === 'destructive') opts.style = { background: 'var(--color-error)', color: '#fff' };
      else if (variant === 'success') opts.style = { background: 'var(--color-primary)', color: '#fff' };
      else if (variant === 'warning') opts.style = { background: 'var(--color-secondary)', color: 'var(--color-text)' };
      sonnerToast(content, opts);
    }
  };
}

export const ToastProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const Toaster = () => null;
