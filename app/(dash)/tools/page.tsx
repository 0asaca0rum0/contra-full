import React from 'react';
import { db } from '@/drizzle/db';
import { tools, projects, projectManagers, users } from '@/drizzle/schema';
import { ilike, eq } from 'drizzle-orm';
import AddToolForm from '../../../components/tools/AddToolForm';
import SectionCard from '@/components/ui/SectionCard';
import { FaScrewdriverWrench } from 'react-icons/fa6';
import EditableToolFields from '../../../components/tools/EditableToolFields';
import ToolHistory from '../../../components/tools/ToolHistory';
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
  const pmRows = await db
    .select({ projectId: projectManagers.projectId, userId: projectManagers.userId, name: users.username })
    .from(projectManagers)
    .innerJoin(users, eq(projectManagers.userId, users.id));
  const pmByProject = new Map<string, { id: string; name: string }[]>();
  pmRows.forEach((pm) => {
    const listForProject = pmByProject.get(pm.projectId) ?? [];
    listForProject.push({ id: pm.userId, name: pm.name });
    pmByProject.set(pm.projectId, listForProject);
  });
  const projectOptions = projectRows.map((p) => ({
    id: p.id,
    name: p.name,
    managers: pmByProject.get(p.id) ?? [],
  }));
  const projectMap = new Map(projectOptions.map((p) => [p.id, p.name]));
  const pmMap = new Map(pmRows.map((pm) => [pm.userId, pm.name]));
  const toolsExport = list.map(t=>({
    id: t.id,
    name: t.name,
    location: projectMap.get(t.location) ?? t.location,
    responsiblePm: t.responsiblePmId ? (pmMap.get(t.responsiblePmId) ?? t.responsiblePmId) : '—',
  }));
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
          {list.length === 0 && <div className="text-base text-slate-400 italic py-10 text-center w-full col-span-full bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">لا توجد أدوات حالياً. قم بإضافة أداة جديدة أعلاه.</div>}
          {list.map(t => (
            <div key={t.id} className="group relative flex flex-col gap-4 rounded-xl border border-slate-200 bg-white px-5 py-5 hover:shadow-xl hover:translate-y-[-2px] hover:border-emerald-200 transition-all duration-300">
              <EditableToolFields
                id={t.id}
                nameInitial={t.name}
                locationInitial={t.location}
                locationLabel={projectMap.get(t.location) ?? t.location ?? '—'}
                responsiblePmIdInitial={t.responsiblePmId ?? ''}
                responsiblePmName={t.responsiblePmId ? (pmMap.get(t.responsiblePmId) ?? '') : ''}
                projectOptions={projectOptions}
              />
            </div>
          ))}
        </div>
      </SectionCard>
      <SectionCard>
        <h2 className="mb-4 text-base font-semibold text-slate-700 flex items-center gap-2">
          <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          آخر حركات الأدوات
        </h2>
        <div className="space-y-4">
          {list.length > 0 && list.slice(0, 3).map((tool) => (
            <div key={tool.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-slate-800">{tool.name}</h3>
                <ToolHistory toolId={tool.id} />
              </div>
            </div>
          ))}
          {list.length === 0 && (
            <div className="text-center text-slate-400 py-8">لا توجد أدوات لعرض حركاتها</div>
          )}
        </div>
      </SectionCard>
    </div>
  );
}

// form moved to client component to avoid hydration issues
