import React from 'react';
import { db } from '@/drizzle/db';
import { tools, projects } from '@/drizzle/schema';
import { ilike } from 'drizzle-orm';
import AddToolForm from '../../../components/tools/AddToolForm';
import SectionCard from '@/components/ui/SectionCard';
import { FaScrewdriverWrench } from 'react-icons/fa6';
import EditableToolFields from '../../../components/tools/EditableToolFields';
import AccountingExportButton from '@/components/accounting/AccountingExportButton';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'الأدوات' };

export default async function ToolsPage({ searchParams }: { searchParams: Promise<{ search?: string }> }) {
  const sp = await searchParams;
  let rows;
  const term = sp.search?.trim();
  if (term) {
    rows = await db.select().from(tools).where(ilike(tools.name, `%${term}%`));
  } else {
    rows = await db.select().from(tools);
  }
  const list = rows as any[];
  const projectRows = await db.select({ id: projects.id, name: projects.name }).from(projects);
  const projectOptions = projectRows.map((p) => ({ id: p.id, name: p.name }));
  const projectMap = new Map(projectOptions.map((p) => [p.id, p.name]));
  const toolsExport = list.map(t=>({ id: t.id, name: t.name, location: projectMap.get(t.location) ?? t.location }));
  const summary = [{ count: toolsExport.length }];
  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-semibold flex items-center gap-2 text-slate-800">
          <FaScrewdriverWrench className="text-emerald-500" /> الأدوات
        </h1>
  <form className="flex items-stretch gap-2" method="GET">
          <input name="search" placeholder="بحث عن أداة" defaultValue={term || ''} className="border border-slate-200 focus:ring-2 focus:ring-emerald-500/40 focus:outline-none rounded-md px-3 py-2 text-sm w-56 bg-white placeholder:text-slate-400" />
          <button className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors">بحث</button>
        </form>
  <AccountingExportButton
    filename="تقرير_الأدوات"
    text="تصدير"
    sheets={[
      { sheet: 'ملخص', rows: summary },
      { sheet: 'الأدوات', rows: toolsExport }
    ]}
  />
      </div>

      <SectionCard className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="text-sm text-slate-500">عدد الأدوات: <span className="font-semibold text-slate-700">{list.length}</span></div>
        </div>
        <AddToolForm projects={projectOptions} />
        <div className={`grid gap-6 ${(list.length > 1) ? 'sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4' : 'grid-cols-1'}`}>
          {list.length === 0 && <div className="text-base text-[var(--color-text-secondary)]">لا توجد أدوات حالياً</div>}
          {list.map(t => (
            <div key={t.id} className="group relative flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white px-6 pt-5 pb-6 hover:shadow-lg shadow transition-colors overflow-hidden focus:outline-none focus:ring-2 focus:ring-emerald-500/60">
              <EditableToolFields
                id={t.id}
                nameInitial={t.name}
                locationInitial={t.location}
                locationLabel={projectMap.get(t.location) ?? t.location ?? '—'}
                projectOptions={projectOptions}
              />
              <div className="absolute inset-0 rounded-2xl ring-1 ring-transparent group-hover:ring-emerald-400/40 transition-colors pointer-events-none" />
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

// form moved to client component to avoid hydration issues
