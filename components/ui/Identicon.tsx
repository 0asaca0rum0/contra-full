"use client";
import React from 'react';

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

function hslFrom(str: string) {
  const h = hash(str) % 360;
  const s = 55 + (hash(str + 's') % 30); // 55-84
  const l = 45 + (hash(str + 'l') % 20); // 45-64
  return `hsl(${h}deg ${s}% ${l}%)`;
}

export default function Identicon({ seed, size = 32, className = '' }: { seed: string; size?: number; className?: string }) {
  const bg = hslFrom(seed);
  const initials = seed.split('-')[0].slice(0, 2).toUpperCase();
  return (
    <div
      className={"rounded-md font-semibold flex items-center justify-center text-white text-xs overflow-hidden " + className}
      style={{ width: size, height: size, background: bg }}
      title={seed}
    >
      {initials}
    </div>
  );
}
