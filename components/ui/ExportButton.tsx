"use client";
import { useState } from 'react';
import { Button } from './button';
import ExcelJS from 'exceljs';

type Props<T extends Record<string, any>> = {
  filename?: string;
  data: T[]; // array of plain objects
  transform?: (row: T) => Record<string, any>; // optional transform before export
  text?: string;
  variant?: any;
  size?: any;
};

// ExcelJS export (single sheet). Falls back to JSON blob if export fails.
export default function ExportButton<T extends Record<string, any>>({ filename = 'export', data, transform, text = 'تصدير Excel', variant, size }: Props<T>) {
  const [busy, setBusy] = useState(false);

  const handle = async () => {
    if (!data || data.length === 0) return;
    setBusy(true);
    try {
      const rows = transform ? data.map(r => transform(r)) : data;
      
      // Create workbook and worksheet
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Sheet1');
      
      // Add headers from first row keys
      if (rows.length > 0) {
        const headers = Object.keys(rows[0]);
        worksheet.addRow(headers);
        
        // Style header row
        worksheet.getRow(1).font = { bold: true };
        
        // Add data rows
        for (const row of rows) {
          worksheet.addRow(headers.map(h => row[h]));
        }
      }
      
      // Generate buffer and download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename.replace(/\.[a-z]+$/i,'') + '.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      // Fallback to JSON export
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
