import React from 'react';
import { db } from '@/drizzle/db';
import { warehouseItems, projects, projectManagers, users } from '@/drizzle/schema';
import SectionCard from '@/components/ui/SectionCard';
import AddWarehouseItemForm from '../../../components/warehouse/AddWarehouseItemForm';
import WarehouseItemCard from '../../../components/warehouse/WarehouseItemCard';
import TransactionHistory from '../../../components/warehouse/TransactionHistory';
import { desc, eq } from 'drizzle-orm';
import AccountingExportButton from '@/components/accounting/AccountingExportButton';
import { FaBoxesStacked } from 'react-icons/fa6';

export const metadata = { title: 'المخزن' };
export const dynamic = 'force-dynamic';

async function getData() {
  const items = await db.select().from(warehouseItems).orderBy(desc(warehouseItems.createdAt));
  const projectsData = await db.select({ id: projects.id, name: projects.name }).from(projects);
  const pmData = await db
    .select({ projectId: projectManagers.projectId, userId: projectManagers.userId, name: users.username })
    .from(projectManagers)
    .innerJoin(users, eq(projectManagers.userId, users.id));
  
  // Structure PMs by Project
  const pmByProject = new Map<string, { id: string; name: string }[]>();
  pmData.forEach((pm) => {
    const list = pmByProject.get(pm.projectId) ?? [];
    list.push({ id: pm.userId, name: pm.name });
    pmByProject.set(pm.projectId, list);
  });

  const projectOptions = projectsData.map(p => ({
    id: p.id,
    name: p.name,
    managers: pmByProject.get(p.id) ?? []
  }));

  return { items, projectOptions };
}

export default async function WarehousePage() {
  const { items, projectOptions } = await getData();
  const itemsExport = items.map(i=>({ id: i.id, name: i.name, quantity: i.quantity, imageUrl: i.imageUrl, createdAt: i.createdAt }));
  
  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-semibold text-slate-800 flex items-center gap-2">
            <FaBoxesStacked className="text-emerald-500" /> المخزن
        </h1>
        <AccountingExportButton filename="تقرير_المخزن" text="تصدير" sheets={[{ sheet: 'الأصناف', rows: itemsExport }]} />
      </div>
      <SectionCard>
        <AddWarehouseItemForm />
      </SectionCard>
      <SectionCard>
        <h2 className="mb-4 text-base font-semibold text-slate-700">الأصناف المتاحة</h2>
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-6 py-16 text-center text-sm text-slate-500">
            لا توجد أصناف في المخزن حالياً.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => (
              <WarehouseItemCard
                key={item.id}
                id={item.id}
                name={item.name}
                quantity={item.quantity}
                imageUrl={item.imageUrl}
                projects={projectOptions}
              />
            ))}
          </div>
        )}
      </SectionCard>
      <SectionCard>
        <h2 className="mb-4 text-base font-semibold text-slate-700 flex items-center gap-2">
          <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          سجل حركات المخزن
        </h2>
        <TransactionHistory />
      </SectionCard>
    </div>
  );
}
