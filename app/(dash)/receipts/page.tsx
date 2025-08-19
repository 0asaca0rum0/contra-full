import React from 'react';
import SectionCard from '@/components/ui/SectionCard';
import TransactionsForm from '@/components/transactions/TransactionsForm';
import { cookies } from 'next/headers';
import { db } from '@/drizzle/db';
import { users } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';
import { getBaseUrl } from '@/lib/baseUrl';
import LogoutLink from '@/components/auth/LogoutLink';
import DeleteTxButton from '@/components/transactions/DeleteTxButton';
import AccountingExportButton from '@/components/accounting/AccountingExportButton';

async function getAll() {
  const base = await getBaseUrl();
  let cookieHeader = '';
  try { cookieHeader = (await cookies()).toString(); } catch {}
  const headers: Record<string,string> = cookieHeader ? { cookie: cookieHeader } : {};
  const [txRes, projectsRes] = await Promise.all([
    fetch(`${base}/api/transactions`, { cache: 'no-store', headers }),
    fetch(`${base}/api/projects`, { cache: 'no-store', headers }),
  ]);
  const tx = txRes.ok ? (await txRes.json()).transactions || [] : [];
  const projects = projectsRes.ok ? (await projectsRes.json()).projects || [] : [];
  return { tx, projects };
}

export const metadata = { title: 'المعاملات و الإيصالات' };

export default async function ReceiptsMergedPage() {
  const { tx, projects } = await getAll();
  const projectNameMap = new Map<string,string>(projects.map((p: any) => [p.id, p.name]));
  // Auth debug info (handle both sync/async cookies implementation)
  let cookieStore: any;
  try {
    const maybe = cookies();
    cookieStore = typeof (maybe as any).then === 'function' ? await maybe : maybe;
  } catch {}
  const uid = cookieStore?.get?.('uid')?.value;
  let currentUser: any = null;
  if (uid) {
    const row = await db.select().from(users).where(eq(users.id, uid)).limit(1);
    currentUser = row[0] || null;
  }
  const txExport = (tx || []).map((t: any)=>({
    id: t.id,
    date: t.created_at || t.createdAt,
    amount: t.amount,
    description: t.description,
    projectId: t.project_id || t.projectId,
    supplierId: t.supplier_id || t.supplierId,
    receiptUrl: t.receiptUrl || t.receipt_url,
  }));
  const total = txExport.reduce((s: number, r: any)=> s + (Number(r.amount)||0), 0);
  const summary = [{ count: txExport.length, totalAmount: total }];
  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-semibold text-slate-800">المعاملات و الإيصالات</h1>
        <AccountingExportButton filename="تقرير_الإيصالات" text="تصدير" sheets={[{ sheet: 'ملخص', rows: summary }, { sheet: 'المعاملات', rows: txExport }]} />
      </div>
      {!currentUser && (
        <div className="p-3 rounded border border-amber-300 bg-amber-50 text-amber-800 text-sm">
          لا يوجد مستخدم مسجل دخول حالياً. انتقل إلى <a href="/login" className="underline font-medium">تسجيل الدخول</a> أولاً. بعد تسجيل الدخول أعد تحميل الصفحة.
        </div>
      )}
      {currentUser && (
        <div className="p-2 rounded border bg-emerald-50 border-emerald-200 text-emerald-700 text-xs flex items-center justify-between">
          <span>مستخدم حالي: {currentUser.username} (الدور: {currentUser.role})</span>
          {/* Client component for logout to avoid event handler in server component */}
          <LogoutLink />
        </div>
      )}
      <SectionCard>
        <TransactionsForm />
      </SectionCard>
      <SectionCard>
        <h2 className="font-semibold mb-4 text-base text-slate-700">أحدث المعاملات</h2>
        <div className="overflow-auto max-h-[520px] pr-1">
          <table className="w-full text-sm border-separate border-spacing-y-2">
            <thead className="text-[11px] text-slate-500">
              <tr className="text-right">
                <th className="font-medium">التاريخ</th>
                <th className="font-medium">المبلغ</th>
                <th className="font-medium">الوصف</th>
                <th className="font-medium">المشروع</th>
                <th className="font-medium">المورد</th>
                <th className="font-medium">الإيصال</th>
                <th className="font-medium">حذف</th>
              </tr>
            </thead>
            <tbody>
              {tx.length === 0 && <tr><td colSpan={7} className="py-10 text-center text-slate-400">لا توجد معاملات</td></tr>}
              {tx.map((t: any) => {
                const url = t.receiptUrl || t.receipt_url;
                return (
                  <tr key={t.id} className="bg-slate-50 hover:bg-slate-100 transition-colors">
                    <td className="px-2 py-2 text-[12px] text-slate-600">{new Date(t.created_at || t.createdAt).toLocaleDateString('ar')}</td>
                    <td className="px-2 py-2 font-mono text-[13px] text-emerald-700">{t.amount}</td>
                    <td className="px-2 py-2 max-w-[240px] truncate" title={t.description}>{t.description}</td>
                    <td className="px-2 py-2 text-[11px] font-mono text-slate-500" title={t.project_id || t.projectId}>{projectNameMap.get(t.project_id || t.projectId) || (t.project_id || t.projectId)}</td>
                    <td className="px-2 py-2 text-[11px] font-mono text-slate-500">{t.supplier_id || t.supplierId || '—'}</td>
                    <td className="px-2 py-2 text-center">{url ? <a href={url} target="_blank" className="text-emerald-600 hover:underline text-[12px]">عرض</a> : <span className="text-slate-400 text-[11px]">—</span>}</td>
                    <td className="px-2 py-2 text-center">
                      <DeleteTxButton id={t.id} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
