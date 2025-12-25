"use client";
import { motion } from 'framer-motion';
import { PropsWithChildren } from 'react';

interface SectionCardProps extends PropsWithChildren {
  className?: string;
  delay?: number;
  variant?: 'light' | 'dark' | 'glass';
}

export default function SectionCard({ 
  children, 
  className = '', 
  delay = 0,
  variant = 'light'
}: SectionCardProps) {
  
  const variants = {
    light: 'bg-white border-slate-200 text-slate-900 shadow-sm',
    dark: 'bg-[#1a1c1e] border-white/10 text-white shadow-2xl',
    glass: 'bg-emerald-500/5 border-emerald-500/20 text-slate-900 shadow-sm'
  };

  return (
    <motion.section
      initial={{ y: 12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay }}
      className={[
        'rounded-[2rem] p-6 border transition-all duration-300',
        variants[variant],
        className,
      ].join(' ')}
    >
      {children}
    </motion.section>
  );
}
