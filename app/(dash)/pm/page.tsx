export const metadata = { title: 'مديرو المشاريع' };
import { getBaseUrl } from '@/lib/baseUrl';
import { cookies } from 'next/headers';
import SectionCard from '@/components/ui/SectionCard';
import Identicon from '@/components/ui/Identicon';
import Link from 'next/link';
import { FaUsersGear, FaMoneyBillTrendUp } from 'react-icons/fa6';
import AccountingExportButton from '@/components/accounting/AccountingExportButton';

async function getPMs() {
  const base = await getBaseUrl();
  const ck = await cookies();
  const cookieHeader = ck.getAll().map(c => `${c.name}=${c.value}`).join('; ');
  const res = await fetch(`${base}/api/pm/overview`, {
    cache: 'no-store',
    headers: cookieHeader ? { cookie: cookieHeader } : {},
  });
  if (!res.ok) return { pms: [] };
  return res.json();
}

export const dynamic = 'force-dynamic';

export default async function PMDirectoryPage() {
  const { pms } = await getPMs();
  const exportRows = pms.map((pm: any)=>({ id: pm.id, username: pm.username, allocated: pm.allocated, spent: pm.spent, remaining: pm.remaining }));
  const summary = [{ count: exportRows.length, totalAllocated: exportRows.reduce((s:number,r:any)=>s+Number(r.allocated||0),0) }];
  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-semibold flex items-center gap-2 text-slate-800">
          <FaUsersGear className="text-emerald-500" /> مديرو المشاريع
        </h1>
        <div className="flex items-center gap-3">
          <AccountingExportButton filename="تقرير_مديري_المشاريع" text="تصدير" sheets={[{ sheet: 'ملخص', rows: summary }, { sheet: 'المديرون', rows: exportRows }]} />
          <Link href="/projects" className="text-sm px-3 py-1.5 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors">المشاريع</Link>
        </div>
      </div>

      <SectionCard>
        <div className={`grid gap-8 ${(pms.length > 1) ? 'sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4' : 'grid-cols-1'}`}>
          {pms.length === 0 && <div className="text-base text-[var(--color-text-secondary)]">لا يوجد مديرون</div>}
          {pms.map((pm: any) => (
            <Link
              key={pm.id}
              href={`/pm/${pm.id}`}
              className="group relative flex flex-col gap-6 rounded-2xl border border-slate-200 bg-white px-8 pt-7 pb-8 hover:shadow-lg shadow transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/70 overflow-hidden"
            >
              <div className="flex items-start gap-6">
                <Identicon seed={pm.id} size={72} />
                <div className="flex-1 min-w-0 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight leading-none break-words">{pm.username}</h2>
                    {/* ID hidden intentionally */}
                  </div>
                  <div className="flex flex-wrap gap-3 text-[13px] font-medium">
                    <div className="flex flex-col items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50/50 w-28 h-24">
                      <span className="text-[11px] text-emerald-600 mb-1">مخصص</span>
                      <span className="font-semibold text-emerald-700 text-2xl leading-none">{pm.allocated}</span>
                    </div>
                    <div className="flex flex-col items-center justify-center rounded-xl border border-rose-200 bg-rose-50/50 w-28 h-24">
                      <span className="text-[11px] text-rose-600 mb-1">مصروف</span>
                      <span className="font-semibold text-rose-700 text-2xl leading-none">{pm.spent}</span>
                    </div>
                    <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50/70 w-28 h-24">
                      <span className="text-[11px] text-slate-600 mb-1">متبقي</span>
                      <span className="font-semibold text-slate-700 text-2xl leading-none">{pm.remaining}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-1 text-[12px] text-slate-500">
                <FaMoneyBillTrendUp className="text-emerald-500" />
                <span>تفاصيل</span>
              </div>
              <div className="absolute inset-0 rounded-2xl ring-1 ring-transparent group-hover:ring-emerald-400/50 transition-colors" />
            </Link>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
