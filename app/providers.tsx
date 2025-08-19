"use client";
import { ReactNode } from 'react';
import { Toaster as SonnerToaster } from 'sonner';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <SonnerToaster position="top-left" dir="rtl" richColors closeButton />
    </>
  );
}
