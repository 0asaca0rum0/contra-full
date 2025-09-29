import type { ReactNode } from 'react';
import { getBaseUrl } from '@/lib/baseUrl';
import SectionCard from '@/components/ui/SectionCard';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { FaTruckMoving, FaMoneyBillTrendUp } from 'react-icons/fa6';
import AccountingExportButton from '@/components/accounting/AccountingExportButton';
import SuppliersWorkspace from '@/components/suppliers/SuppliersWorkspace';

export const metadata = { title: 'الموردون' };
export const dynamic = 'force-dynamic';

async function getSuppliers() {
  const base = await getBaseUrl();
  let list: any[] = [];
  try {
    const cookieHeader = (await cookies()).toString();
    const res = await fetch(`${base}/api/suppliers/overview`, { cache: 'no-store', headers: { cookie: cookieHeader, 'x-suppliers-dir': '1' } });
    if (res.ok) {
      const data = await res.json();
      list = data.suppliers || [];
    } else {
      console.error('[SUPPLIERS_DIR_FETCH_ERROR]', res.status);
    }
  } catch (e) {
    console.error('[SUPPLIERS_DIR_FETCH_EXCEPTION]', e);
  }
  return list;
}

export default async function SuppliersDirectoryPage() {
  const suppliers = await getSuppliers();
  const suppliersExport = suppliers.map((s: any) => ({
    id: s.id,
    name: s.name,
    balance: s.balance,
    spent: s.spent,
    transactionsCount: s.transactionsCount,
    lastTransaction: s.lastTransaction,
  }));
  const formatter = new Intl.NumberFormat('en-US');
  const totals = suppliers.reduce(
    (acc, supplier: any) => {
      acc.balance += supplier.balance || 0;
      acc.spent += supplier.spent || 0;
      acc.transactions += supplier.transactionsCount || 0;
      return acc;
    },
    { balance: 0, spent: 0, transactions: 0 }
  );
  const metricCards = [
    { title: 'عدد الموردين', value: suppliers.length },
    {
      title: 'إجمالي الأرصدة',
      value: totals.balance,
      subtitle: 'الرصيد الحالي الفعّال',
      icon: <FaMoneyBillTrendUp className="text-emerald-500" />,
    },
    { title: 'إجمالي المصروف', value: totals.spent, subtitle: 'منذ بداية التعامل' },
    { title: 'عدد المعاملات', value: totals.transactions, subtitle: 'آخر 12 شهرًا' },
  ];
  return (
    <div className="mx-auto max-w-6xl space-y-12 px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <section className="rounded-3xl border border-emerald-100/70 bg-gradient-to-br from-emerald-50 via-white to-white/90 px-8 py-10 shadow-lg ring-1 ring-emerald-100/50">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-emerald-600">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-xl">
                <FaTruckMoving />
              </span>
              <div className="space-y-1">
                <h1 className="text-2xl font-semibold text-emerald-950">لوحة الموردين</h1>
                <p className="text-sm leading-6 text-emerald-900/70">تابع علاقات الموردين، أدر الأرصدة بوضوح، وصدّر التقارير التفصيلية بسلاسة.</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <AccountingExportButton
              filename="تقرير_الموردين"
              text="تصدير"
              sheets={[{ sheet: 'الموردون', rows: suppliersExport }]}
              endpoints={[{ url: '/api/transactions?limit=100', sheet: 'أحدث_المعاملات' }]}
            />
            <Link
              href="/projects"
              className="inline-flex h-11 items-center justify-center rounded-full border border-emerald-200/70 bg-white/80 px-5 text-sm font-semibold text-emerald-700 shadow-sm transition hover:border-emerald-300 hover:text-emerald-800"
            >
              المشاريع
            </Link>
          </div>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {metricCards.map((metric) => (
            <MetricCard key={metric.title} formatter={formatter} {...metric} />
          ))}
        </div>
      </section>

      <SectionCard className="space-y-8 border border-slate-100/80 bg-white/95">
        <header className="space-y-2 border-b border-slate-100 pb-5">
          <h2 className="text-lg font-semibold text-slate-800">سير العمل الموحد</h2>
          <p className="text-sm leading-6 text-slate-500">
            تنقل بين نظرة عامة تفاعلية على الموردين وإدارة بياناتهم المالية من خلال الواجهة نفسها دون تكرار للمحتوى.
          </p>
        </header>
        <SuppliersWorkspace suppliers={suppliers} />
      </SectionCard>
    </div>
  );
}

type MetricCardProps = {
  title: string;
  value: number;
  subtitle?: string;
  icon?: ReactNode;
  formatter: Intl.NumberFormat;
};

function MetricCard({ title, value, subtitle, icon, formatter }: MetricCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-emerald-100/60 bg-white/80 p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg">
      <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-emerald-200 to-transparent" />
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5">
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-500/80">{title}</div>
          <div className="text-2xl font-semibold text-emerald-900">{formatter.format(value)}</div>
          {subtitle && <p className="text-[12px] text-emerald-600/80">{subtitle}</p>}
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
          {icon ?? <FaTruckMoving />}
        </span>
      </div>
    </div>
  );
}
