"use client";
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import * as XLSX from 'xlsx';

type EndpointConfig = {
  url: string;            // API endpoint (relative)
  sheet: string;          // Arabic sheet name
  extract?: (json: any) => any[]; // how to get rows
  map?: (row: any) => any; // optional per-row transform
};

type SheetConfig = { sheet: string; rows: any[] };

interface Props {
  endpoints?: EndpointConfig[]; // endpoints to fetch at click time
  sheets?: SheetConfig[];       // pre-fetched rows (e.g., from server component props)
  filename?: string;            // base filename
  text?: string;                // button label
  variant?: any;
  size?: any;
}

// Key -> Arabic header mapping
const AR_HEADERS: Record<string,string> = {
  id: 'المعرف',
  name: 'الاسم',
  balance: 'الرصيد',
  spent: 'المدفوع',
  transactionsCount: 'عدد العمليات',
  tx_count: 'عدد العمليات',
  lastTransaction: 'آخر عملية',
  last_tx: 'آخر عملية',
  amount: 'المبلغ',
  description: 'الوصف',
  date: 'التاريخ',
  createdAt: 'التاريخ',
  created_at: 'التاريخ',
  projectId: 'المشروع',
  project_id: 'المشروع',
  project: 'المشروع',
  userId: 'المستخدم',
  user_id: 'المستخدم',
  user: 'المستخدم',
  supplierId: 'المورد',
  supplier_id: 'المورد',
  receiptUrl: 'الإيصال',
  receipt_url: 'الإيصال',
  quantity: 'الكمية',
  type: 'النوع',
  location: 'الموقع',
  currentBudget: 'المخصص الحالي',
  totalProjectBudget: 'إجمالي الميزانية',
  projectSpent: 'المصروف',
  delta: 'التغير',
  newBudget: 'الميزانية الجديدة',
  oldBudget: 'الميزانية السابقة',
  count: 'العدد',
  totalAmount: 'إجمالي_المبلغ',
  totalAllocated: 'إجمالي_المخصص',
  allocated: 'المخصص',
  remaining: 'المتبقي',
};

function localizeRows(rows: any[]): any[] {
  return rows.map(r => {
    const out: Record<string, any> = {};
    for (const k of Object.keys(r || {})) {
      const arabic = AR_HEADERS[k] || k;
      if (out[arabic] == null) out[arabic] = r[k];
    }
    return out;
  });
}

export default function AccountingExportButton({ endpoints = [], sheets = [], filename = 'تقرير_محاسبي', text = 'تصدير Excel شامل', variant = 'outline', size = 'sm' }: Props) {
  const [busy, setBusy] = useState(false);

  async function fetchEndpoint(e: EndpointConfig): Promise<{ sheet: string; rows: any[] }> {
    const res = await fetch(e.url, { cache: 'no-store' });
    if (!res.ok) return { sheet: e.sheet, rows: [] };
    let json: any = null; try { json = await res.json(); } catch {}
    const raw = e.extract ? e.extract(json) : (Array.isArray(json?.data?.items) ? json.data.items : (json?.transactions || json?.suppliers || json?.projects || json?.items || json?.expenses || []));
    const mapped = (raw || []).map((row: any) => e.map ? e.map(row) : row);
    return { sheet: e.sheet, rows: mapped };
  }

  const handle = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const epSheets = await Promise.all(endpoints.map(fetchEndpoint));
      const all = [...sheets, ...epSheets].filter(s => (s.rows || []).length);
      if (all.length === 0) {
        alert('لا توجد بيانات للتصدير');
        return;
      }
      const wb = XLSX.utils.book_new();
      for (const s of all) {
        const localized = localizeRows(s.rows);
        const ws = XLSX.utils.json_to_sheet(localized);
        XLSX.utils.book_append_sheet(wb, ws, sanitizeSheetName(s.sheet));
      }
      const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename.replace(/\.[a-z]+$/i,'') + '.xlsx';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    } catch (e) {
      alert('فشل التصدير: ' + (e as any)?.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button type="button" onClick={handle} disabled={busy} variant={variant} size={size} className="whitespace-nowrap">
      {busy ? 'جارٍ التصدير…' : text}
    </Button>
  );
}

function sanitizeSheetName(name: string): string {
  return name.replace(/[\\\/*?:\[\]]/g, '_').slice(0, 28) || 'Sheet';
}
