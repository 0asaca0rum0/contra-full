import SectionCard from '@/components/ui/SectionCard';
import TransactionsForm from '@/components/transactions/TransactionsForm';
import { getBaseUrl } from '@/lib/baseUrl';
import { cookies } from 'next/headers';
import AccountingExportButton from '@/components/accounting/AccountingExportButton';

type ApiTransaction = {
  id: string;
  created_at?: string | null;
  createdAt?: string | null;
  amount: number | string;
  description: string;
  project_id?: string | null;
  projectId?: string | null;
  user_id?: string | null;
  userId?: string | null;
  receiptUrl?: string | null;
  receipt_url?: string | null;
};

type ApiProject = {
  id: string;
  name: string;
};

type TransactionRow = {
  id: string;
  date: string | null;
  amount: number | string;
  description: string;
  projectId: string | null;
  project: string;
  userId: string | null;
  receiptUrl?: string | null;
};

async function getData(): Promise<{ tx: ApiTransaction[]; projects: ApiProject[] }> {
  const baseUrl = await getBaseUrl();
  const token = (await cookies()).get('token');
  const headers: HeadersInit | undefined = token?.value
    ? { Authorization: `Bearer ${token.value}` }
    : undefined;

  const [txRes, projectsRes] = await Promise.all([
    fetch(`${baseUrl}/api/transactions`, { headers, cache: 'no-store' }),
    fetch(`${baseUrl}/api/projects`, { headers, cache: 'no-store' }),
  ]);

  const txJson = txRes.ok ? await txRes.json() : { transactions: [] };
  const projectsJson = projectsRes.ok ? await projectsRes.json() : { projects: [] };

  return {
    tx: (txJson.transactions as ApiTransaction[] | undefined) ?? [],
    projects: (projectsJson.projects as ApiProject[] | undefined) ?? [],
  };
}

export const metadata = { title: 'المعاملات' };

export default async function TransactionsPage() {
  const { tx, projects } = await getData();
  const projectNameMap = new Map<string, string>(projects.map((project) => [project.id, project.name]));

  const dateFormatter = new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const currencyFormatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const integerFormatter = new Intl.NumberFormat('en-US');

  const txExport: TransactionRow[] = (tx ?? []).map((transaction) => {
    const projectId = transaction.project_id ?? transaction.projectId ?? null;
    return {
      id: transaction.id,
      date: transaction.created_at ?? transaction.createdAt ?? null,
      amount: transaction.amount,
      description: transaction.description,
      projectId,
      project: projectNameMap.get(projectId ?? '') ?? projectId ?? '—',
      userId: transaction.user_id ?? transaction.userId ?? null,
      receiptUrl: transaction.receiptUrl ?? transaction.receipt_url ?? null,
    };
  });

  const totals = txExport.reduce<{ totalAmount: number; withReceipts: number }>(
    (accumulator, entry) => {
      const amountValue = Number(entry.amount) || 0;
      accumulator.totalAmount += amountValue;
      if (entry.receiptUrl) {
        accumulator.withReceipts += 1;
      }
      return accumulator;
    },
    { totalAmount: 0, withReceipts: 0 }
  );

  const summary = [
    {
      count: txExport.length,
      totalAmount: totals.totalAmount,
      withReceipts: totals.withReceipts,
      withoutReceipts: txExport.length - totals.withReceipts,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-12 px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <section className="rounded-3xl border border-emerald-100/70 bg-gradient-to-br from-emerald-50 via-white to-white/95 px-8 py-10 shadow-lg ring-1 ring-emerald-100/60">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <h1 className="text-2xl font-semibold text-emerald-950">لوحة المعاملات</h1>
            <p className="max-w-xl text-sm leading-6 text-emerald-900/75">
              راقب عمليات الصرف، أضف معاملات جديدة، وتابع الإيصالات المرفقة بدقة.
            </p>
          </div>
          <AccountingExportButton
            filename="تقرير_المعاملات"
            text="تصدير"
            sheets={[
              { sheet: 'ملخص', rows: summary },
              { sheet: 'المعاملات', rows: txExport },
            ]}
          />
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="إجمالي المعاملات"
            value={txExport.length}
            formatter={integerFormatter}
            subtitle="عدد السجلات الحالية"
          />
          <MetricCard
            title="إجمالي المبالغ"
            value={totals.totalAmount}
            formatter={currencyFormatter}
            subtitle="القيمة المالية الكلية"
          />
          <MetricCard
            title="مع إيصال"
            value={totals.withReceipts}
            formatter={integerFormatter}
            subtitle="معاملات تحتوي على ملف"
          />
          <MetricCard
            title="بدون إيصال"
            value={txExport.length - totals.withReceipts}
            formatter={integerFormatter}
            subtitle="تحتاج إلى متابعة"
            tone="amber"
          />
        </div>
      </section>

      <SectionCard className="border border-slate-100/80 bg-white/95">
        <TransactionsForm />
      </SectionCard>

      <SectionCard className="space-y-5 border border-slate-100/70 bg-white/95">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-800">أحدث المعاملات</h2>
          <span className="text-xs text-slate-500">آخر تحديث: {dateFormatter.format(new Date())}</span>
        </header>
        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-slate-50 text-[11px] text-slate-500">
              <tr className="text-right">
                <th className="px-4 py-3 font-medium">التاريخ</th>
                <th className="px-4 py-3 font-medium">المبلغ</th>
                <th className="px-4 py-3 font-medium">الوصف</th>
                <th className="px-4 py-3 font-medium">المشروع</th>
                <th className="px-4 py-3 font-medium">المستخدم</th>
                <th className="px-4 py-3 font-medium">الإيصال</th>
              </tr>
            </thead>
            <tbody>
              {txExport.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    لا توجد معاملات
                  </td>
                </tr>
              )}
              {txExport.map((entry) => {
                const amountValue = currencyFormatter.format(Number(entry.amount) || 0);
                const formattedDate = entry.date ? dateFormatter.format(new Date(entry.date)) : '—';
                return (
                  <tr key={entry.id} className="border-t border-slate-100/80 bg-white hover:bg-slate-50/80">
                    <td className="px-4 py-3 text-[12px] text-slate-600">{formattedDate}</td>
                    <td className="px-4 py-3 font-mono text-[13px] text-emerald-700">{amountValue}</td>
                    <td className="px-4 py-3 max-w-[240px] truncate" title={entry.description}>
                      {entry.description}
                    </td>
                    <td className="px-4 py-3 text-[11px] font-mono text-slate-500" title={entry.projectId ?? undefined}>
                      {entry.project}
                    </td>
                    <td className="px-4 py-3 text-[11px] font-mono text-slate-500">{entry.userId ?? '—'}</td>
                    <td className="px-4 py-3 text-center">
                      {entry.receiptUrl ? (
                        <a
                          href={entry.receiptUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[12px] font-semibold text-emerald-600 hover:text-emerald-700"
                        >
                          عرض
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-400">—</span>
                      )}
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

function MetricCard({
  title,
  value,
  subtitle,
  formatter,
  tone = 'emerald',
}: {
  title: string;
  value: number;
  subtitle?: string;
  formatter: Intl.NumberFormat;
  tone?: 'emerald' | 'amber';
}) {
  const toneClasses =
    tone === 'amber'
      ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
      : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200';

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-emerald-100/60 bg-white/85 p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg">
      <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-emerald-200 to-transparent" />
      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-500/80">{title}</div>
        <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${toneClasses}`}>
          {formatter.format(value)}
        </div>
        {subtitle && <p className="text-[12px] text-slate-500">{subtitle}</p>}
      </div>
    </div>
  );
}
