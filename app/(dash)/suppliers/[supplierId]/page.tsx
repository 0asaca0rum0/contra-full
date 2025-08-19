import SectionCard from '@/components/ui/SectionCard';
import Identicon from '@/components/ui/Identicon';
import Link from 'next/link';
import { getBaseUrl } from '@/lib/baseUrl';
import { cookies } from 'next/headers';
import { FaArrowRightLong } from 'react-icons/fa6';
import AccountingExportButton from '@/components/accounting/AccountingExportButton';

export const dynamic = 'force-dynamic';

async function resolveParams(paramsOrPromise: any) {
  if (paramsOrPromise && typeof paramsOrPromise.then === 'function') return await paramsOrPromise;
  return paramsOrPromise;
}

async function fetchSupplier(id: string, cookieHeader?: string) {
  const base = await getBaseUrl();
  const headers: Record<string, string> = { 'x-supplier-fetch': '1' };
  if (cookieHeader) headers.cookie = cookieHeader;
  console.log('[SUPPLIER_PAGE_FETCH] requesting', { id, base });
  const res = await fetch(`${base}/api/suppliers/${id}/overview`, { cache: 'no-store', headers });
  if (!res.ok) {
    console.error('[SUPPLIER_PAGE_FETCH_ERROR]', res.status, res.statusText);
    throw new Error(`Failed to load supplier (${res.status})`);
  }
  return res.json();
}

export default async function SupplierPage(props: any) {
  const raw = props?.params;
  const resolved = raw && typeof raw.then === 'function' ? await raw : raw;
  const supplierId = resolved?.supplierId;
  let supplier: any = null;
  let error: string | null = null;
  try {
    const cookieHeader = (await cookies()).toString();
    const data = await fetchSupplier(supplierId, cookieHeader);
    supplier = data.supplier;
  } catch (e: any) {
    error = e.message || 'خطأ غير متوقع';
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-rose-600">تعذر تحميل المورد</h1>
          <Link href="/suppliers" className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors h-fit">
            <FaArrowRightLong className="rotate-180" /> رجوع
          </Link>
        </div>
        <SectionCard>
          <div className="text-sm text-slate-600 space-y-4">
            <p>حدث خطأ أثناء جلب بيانات المورد.</p>
            <code className="block text-[11px] p-3 rounded bg-rose-50 border border-rose-200 text-rose-700 overflow-auto max-w-full">{error}</code>
          </div>
        </SectionCard>
      </div>
    );
  }

  const summarySheet = [{ id: supplier.id, name: supplier.name, balance: supplier.balance, spent: supplier.spent, transactionsCount: supplier.transactionsCount, lastTransaction: supplier.lastTransaction }];
  const txSheet = (supplier.transactions || []).map((t: any)=>({ id: t.id, amount: t.amount, description: t.description, projectId: t.project_id, userId: t.user_id, createdAt: t.created_at }));
  return (
    <div className="space-y-12">
      <div className="flex items-start justify-between flex-wrap gap-8">
        <div className="flex items-center gap-6">
          <Identicon seed={supplierId} size={88} />
          <div className="space-y-2">
            <h1 className="text-3xl font-bold flex items-center gap-3 text-slate-800 tracking-tight">المورد</h1>
            <div className="text-lg text-slate-600"><span className="font-semibold text-emerald-600">{supplier.name}</span></div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <AccountingExportButton filename={`تقرير_مورد_${supplier.id}`} text="تصدير" sheets={[{ sheet: 'ملخص', rows: summarySheet }, { sheet: 'العمليات', rows: txSheet }]} />
          <Link href="/suppliers" className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors h-fit">
            <FaArrowRightLong className="rotate-180" /> الموردون
          </Link>
        </div>
      </div>

      <SectionCard>
        <div className="flex flex-wrap gap-6">
          <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50/70 w-40 h-28">
            <span className="text-[12px] text-slate-600 mb-1">الرصيد الحالي</span>
            <span className={`font-bold text-2xl leading-none ${supplier.balance >= 0 ? 'text-slate-700' : 'text-rose-600'}`}>{supplier.balance}</span>
          </div>
          <div className="flex flex-col items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50/60 w-40 h-28">
            <span className="text-[12px] text-emerald-600 mb-1">إجمالي المدفوع</span>
            <span className="font-bold text-emerald-700 text-2xl leading-none">{supplier.spent}</span>
          </div>
            <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50/60 w-40 h-28">
              <span className="text-[12px] text-slate-600 mb-1">عدد العمليات</span>
              <span className="font-bold text-slate-700 text-2xl leading-none">{supplier.transactionsCount}</span>
            </div>
            <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50/60 w-40 h-28">
              <span className="text-[12px] text-slate-600 mb-1">آخر عملية</span>
              <span className="font-semibold text-slate-700 text-sm leading-tight">{supplier.lastTransaction ? new Date(supplier.lastTransaction).toLocaleDateString('ar') : '-'}</span>
            </div>
        </div>
      </SectionCard>

      <SectionCard>
        <h2 className="font-semibold mb-6 text-base text-slate-700">سجل العمليات (آخر 200)</h2>
        <div className="overflow-auto max-h-[480px] pr-1">
          <table className="w-full text-sm border-separate border-spacing-y-2">
            <thead className="text-[11px] text-slate-500">
              <tr className="text-right">
                <th className="font-medium">التاريخ</th>
                <th className="font-medium">المبلغ</th>
                <th className="font-medium">الوصف</th>
                <th className="font-medium">المشروع</th>
                <th className="font-medium">المستخدم</th>
              </tr>
            </thead>
            <tbody>
              {supplier.transactions.length === 0 && (
                <tr><td colSpan={5} className="text-center py-8 text-slate-400">لا يوجد عمليات</td></tr>
              )}
              {supplier.transactions.map((t: any) => (
                <tr key={t.id} className="bg-slate-50 hover:bg-slate-100 transition-colors">
                  <td className="px-2 py-2 text-slate-600 text-[12px]">{new Date(t.created_at).toLocaleDateString('ar')}</td>
                  <td className="px-2 py-2 font-mono text-[13px] text-emerald-700">{t.amount}</td>
                  <td className="px-2 py-2 max-w-[260px] truncate" title={t.description}>{t.description}</td>
                  <td className="px-2 py-2 text-[11px] font-mono text-slate-500">{t.project_id || '-'}</td>
                  <td className="px-2 py-2 text-[11px] font-mono text-slate-500">{t.user_id || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
