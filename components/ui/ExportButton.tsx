"use client";
import { useState } from 'react';
import { Button } from './button';
import * as XLSX from 'xlsx';

type Props<T extends Record<string, any>> = {
  filename?: string;
  data: T[]; // array of plain objects
  transform?: (row: T) => Record<string, any>; // optional transform before export
  text?: string;
  variant?: any;
  size?: any;
};

// XLSX export (single sheet). Falls back to JSON blob if XLSX fails.
export default function ExportButton<T extends Record<string, any>>({ filename = 'export', data, transform, text = 'تصدير Excel', variant, size }: Props<T>) {
  const [busy, setBusy] = useState(false);

  const handle = () => {
    if (!data || data.length === 0) return;
    setBusy(true);
    try {
      const rows = transform ? data.map(r => transform(r)) : data;
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      const out = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
      const blob = new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename.replace(/\.[a-z]+$/i,'') + '.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      try {
        const rows = transform ? data.map(r => transform(r)) : data;
        const blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename.replace(/\.[a-z]+$/i,'') + '.json';
        document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
      } catch {}
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button type="button" onClick={handle} disabled={busy || !data?.length} variant={variant || 'outline'} size={size || 'sm'} className="whitespace-nowrap">
  {busy ? 'جارٍ التصدير…' : text}
    </Button>
  );
}
