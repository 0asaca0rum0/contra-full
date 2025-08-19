"use client";
import { motion } from 'framer-motion';
import { PropsWithChildren } from 'react';

interface SectionCardProps extends PropsWithChildren {
  className?: string;
  delay?: number;
}

export default function SectionCard({ children, className = '', delay = 0 }: SectionCardProps) {
  return (
    <motion.section
      initial={{ y: 12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay }}
      className={[
        'rounded-xl p-5 md:p-6 ui-glass ui-hover-card border-emerald-100 shadow-sm',
        className,
      ].join(' ')}
    >
      {children}
    </motion.section>
  );
}
