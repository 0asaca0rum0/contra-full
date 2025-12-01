import type { ReactNode } from 'react';
import { getBaseUrl } from '@/lib/baseUrl';
import SectionCard from '@/components/ui/SectionCard';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { FaTruckMoving, FaMoneyBillTrendUp, FaArrowRight, FaChartPie, FaFileInvoiceDollar } from 'react-icons/fa6';
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
    { 
      title: 'عدد الموردين', 
      value: suppliers.length,
      icon: <FaTruckMoving className="text-blue-500" />,
      trend: 'نشط',
      color: 'blue'
    },
    {
      title: 'إجمالي الأرصدة',
      value: totals.balance,
      subtitle: 'الرصيد الحالي الفعّال',
      icon: <FaMoneyBillTrendUp className="text-emerald-500" />,
      color: 'emerald'
    },
    { 
      title: 'إجمالي المصروف', 
      value: totals.spent, 
      subtitle: 'منذ بداية التعامل',
      icon: <FaFileInvoiceDollar className="text-amber-500" />,
      color: 'amber'
    },
    { 
      title: 'عدد المعاملات', 
      value: totals.transactions, 
      subtitle: 'آخر 12 شهرًا',
      icon: <FaChartPie className="text-violet-500" />,
      color: 'violet'
    },
  ];
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 px-8 py-10 shadow-2xl sm:px-12 sm:py-16">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-emerald-300 backdrop-blur-md ring-1 ring-white/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              إدارة الموردين
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">لوحة الموردين</h1>
            <p className="max-w-xl text-lg text-slate-300">
              تابع علاقات الموردين، أدر الأرصدة بوضوح، وصدّر التقارير التفصيلية بسلاسة من مكان واحد.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <AccountingExportButton
              filename="تقرير_الموردين"
              text="تصدير التقرير"
              sheets={[{ sheet: 'الموردون', rows: suppliersExport }]}
              endpoints={[{ url: '/api/transactions?limit=100', sheet: 'أحدث_المعاملات' }]}
            />
            <Link
              href="/projects"
              className="group inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white/10 px-6 text-sm font-semibold text-white backdrop-blur-md transition-all hover:bg-white/20 hover:ring-1 hover:ring-white/30"
            >
              <span>المشاريع</span>
              <FaArrowRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((metric) => (
          <MetricCard key={metric.title} formatter={formatter} {...metric} />
        ))}
      </div>

      {/* Main Workspace */}
      <SectionCard className="overflow-hidden border border-slate-200 bg-white shadow-sm ring-1 ring-black/5">
        <div className="p-6">
          <SuppliersWorkspace suppliers={suppliers} />
        </div>
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
  color?: string;
  trend?: string;
};

function MetricCard({ title, value, subtitle, icon, formatter, color = 'emerald', trend }: MetricCardProps) {
  const colors: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
    blue: 'bg-blue-50 text-blue-600 ring-blue-100',
    amber: 'bg-amber-50 text-amber-600 ring-amber-100',
    violet: 'bg-violet-50 text-violet-600 ring-violet-100',
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
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                {trend}
              </span>
            )}
          </div>
        </div>
        <div className={`rounded-xl p-2.5 ring-1 ring-inset ${colors[color]}`}>
          {icon}
        </div>
      </div>
      {subtitle && (
        <div className="mt-4 flex items-center gap-2">
          <div className={`h-1 flex-1 rounded-full bg-slate-100 overflow-hidden`}>
            <div className={`h-full w-2/3 rounded-full ${color === 'emerald' ? 'bg-emerald-500' : color === 'blue' ? 'bg-blue-500' : color === 'amber' ? 'bg-amber-500' : 'bg-violet-500'}`} />
          </div>
          <p className="text-xs text-slate-400">{subtitle}</p>
        </div>
      )}
    </div>
  );
}
