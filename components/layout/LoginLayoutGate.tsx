"use client";
import { usePathname } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import React from 'react';

export default function LoginLayoutGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === '/login';
  return (
    <>
      {!isLogin && <Navbar />}
      <main className={isLogin ? 'min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-emerald-100 px-4 py-10' : 'max-w-6xl mx-auto px-4 py-6'}>
        {children}
      </main>
    </>
  );
}
