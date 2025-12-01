import SectionCard from '@/components/ui/SectionCard';
import Identicon from '@/components/ui/Identicon';
import Link from 'next/link';
import { getBaseUrl } from '@/lib/baseUrl';
import { cookies } from 'next/headers';
import { FaArrowRightLong, FaMoneyBillTrendUp, FaFileInvoiceDollar, FaChartPie, FaTruckMoving } from 'react-icons/fa6';
import AccountingExportButton from '@/components/accounting/AccountingExportButton';
import AddSupplierTransactionForm from '@/components/suppliers/AddSupplierTransactionForm';

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
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 -mt-16 -mr-16 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
        
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="flex items-center gap-6">
            <div className="rounded-2xl bg-white/10 p-2 backdrop-blur-sm ring-1 ring-white/20">
              <Identicon seed={supplierId} size={80} className="rounded-xl" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">{supplier.name}</h1>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${supplier.balance > 0 ? 'bg-amber-500/10 text-amber-400 ring-amber-500/20' : supplier.balance < 0 ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20' : 'bg-slate-500/10 text-slate-400 ring-slate-500/20'}`}>
                  {supplier.balance > 0 ? 'لنا' : supplier.balance < 0 ? 'علينا' : 'متزن'}
                </span>
              </div>
              <p className="mt-2 text-slate-400 font-mono text-sm">#{supplier.id.slice(0, 8)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <AccountingExportButton 
              filename={`تقرير_مورد_${supplier.id}`} 
              text="تصدير التقرير" 
              sheets={[{ sheet: 'ملخص', rows: summarySheet }, { sheet: 'العمليات', rows: txSheet }]} 
            />
            <Link 
              href="/suppliers" 
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-900 shadow-lg shadow-black/5 transition-all hover:bg-slate-50 hover:scale-105"
            >
              <FaArrowRightLong className="rotate-180" />
              <span>قائمة الموردين</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="الرصيد الحالي"
          value={Math.abs(supplier.balance)}
          formatter={new Intl.NumberFormat('en-US')}
          icon={<FaMoneyBillTrendUp className="h-5 w-5" />}
          color={supplier.balance > 0 ? 'amber' : supplier.balance < 0 ? 'emerald' : 'slate'}
          trend={supplier.balance > 0 ? 'لنا' : supplier.balance < 0 ? 'علينا' : 'متزن'}
        />
        <MetricCard
          title="إجمالي المدفوع"
          value={supplier.spent}
          formatter={new Intl.NumberFormat('en-US')}
          icon={<FaFileInvoiceDollar className="h-5 w-5" />}
          color="blue"
        />
        <MetricCard
          title="عدد العمليات"
          value={supplier.transactionsCount}
          formatter={new Intl.NumberFormat('en-US')}
          icon={<FaChartPie className="h-5 w-5" />}
          color="violet"
        />
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">آخر نشاط</p>
              <div className="mt-2">
                <span className="text-lg font-bold tracking-tight text-slate-900">
                  {supplier.lastTransaction ? new Date(supplier.lastTransaction).toLocaleDateString('ar') : '-'}
                </span>
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 p-2.5 text-slate-600 ring-1 ring-inset ring-slate-100">
              <FaTruckMoving className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Transactions */}
      <SectionCard className="overflow-hidden border border-slate-200 bg-white shadow-sm ring-1 ring-black/5">
        <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm ring-1 ring-slate-200">
              <FaFileInvoiceDollar className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800">سجل العمليات</h2>
              <p className="text-xs text-slate-500">آخر 200 عملية مالية</p>
            </div>
          </div>
          <AddSupplierTransactionForm supplierId={supplier.id} />
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/30 text-right text-xs font-semibold text-slate-500">
                <th className="px-6 py-4">التاريخ</th>
                <th className="px-6 py-4">النوع</th>
                <th className="px-6 py-4">المبلغ</th>
                <th className="px-6 py-4">الوصف</th>
                <th className="px-6 py-4">المشروع</th>
                <th className="px-6 py-4">المستخدم</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {supplier.transactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <FaFileInvoiceDollar className="mb-3 h-10 w-10 opacity-20" />
                      <p>لا توجد عمليات مسجلة</p>
                    </div>
                  </td>
                </tr>
              )}
              {supplier.transactions.map((t: any) => {
                const isPayment = t.amount < 0;
                return (
                  <tr key={t.id} className="group transition-colors hover:bg-slate-50/50">
                    <td className="px-6 py-4 text-slate-600 font-mono text-xs">
                      {new Date(t.created_at).toLocaleDateString('ar')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ring-inset ${isPayment ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' : 'bg-amber-50 text-amber-700 ring-amber-600/20'}`}>
                        {isPayment ? 'سداد' : 'فاتورة'}
                      </span>
                    </td>
                    <td className={`px-6 py-4 font-mono font-bold ${isPayment ? 'text-emerald-600' : 'text-slate-700'}`}>
                      {Math.abs(t.amount).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 max-w-[300px] truncate text-slate-600" title={t.description}>
                      {t.description}
                    </td>
                    <td className="px-6 py-4">
                      {t.project_id ? (
                        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                          {t.project_id.slice(0, 8)}...
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {t.user_id ? t.user_id.slice(0, 8) : '-'}
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

function MetricCard({ title, value, formatter, icon, color = 'slate', trend }: any) {
  const colors: any = {
    emerald: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
    blue: 'bg-blue-50 text-blue-600 ring-blue-100',
    amber: 'bg-amber-50 text-amber-600 ring-amber-100',
    violet: 'bg-violet-50 text-violet-600 ring-violet-100',
    slate: 'bg-slate-50 text-slate-600 ring-slate-100',
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              {formatter.format(value)}
            </span>
            {trend && (
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${color === 'emerald' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' : color === 'amber' ? 'bg-amber-50 text-amber-700 ring-amber-600/20' : 'bg-slate-50 text-slate-700 ring-slate-600/20'}`}>
                {trend}
              </span>
            )}
          </div>
        </div>
        <div className={`rounded-xl p-2.5 ring-1 ring-inset ${colors[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
