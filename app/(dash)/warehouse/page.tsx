import React from 'react';
import { db } from '@/drizzle/db';
import { warehouseItems } from '@/drizzle/schema';
import SectionCard from '@/components/ui/SectionCard';
// Using relative imports to avoid transient alias resolution issue for newly added files
import AddWarehouseItemForm from '../../../components/warehouse/AddWarehouseItemForm';
import AdjustStockControls from '../../../components/warehouse/AdjustStockControls';
import { desc } from 'drizzle-orm';
import AccountingExportButton from '@/components/accounting/AccountingExportButton';

export const metadata = { title: 'المخزن' };
export const dynamic = 'force-dynamic';

async function getItems() {
  return await db.select().from(warehouseItems).orderBy(desc(warehouseItems.createdAt));
}

export default async function WarehousePage() {
  const items = await getItems();
  const itemsExport = items.map(i=>({ id: i.id, name: i.name, quantity: i.quantity, imageUrl: i.imageUrl, createdAt: i.createdAt }));
  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-semibold text-slate-800">المخزن</h1>
        <AccountingExportButton filename="تقرير_المخزن" text="تصدير" sheets={[{ sheet: 'الأصناف', rows: itemsExport }]} />
      </div>
      <SectionCard>
        <AddWarehouseItemForm />
      </SectionCard>
      <SectionCard>
        <h2 className="font-semibold mb-4 text-base text-slate-700">الأصناف</h2>
        <div className="overflow-auto">
          <table className="w-full text-sm border-separate border-spacing-y-2">
            <thead className="text-[11px] text-slate-500">
              <tr className="text-right">
                <th className="font-medium">الاسم</th>
                <th className="font-medium">الكمية</th>
                <th className="font-medium">صورة</th>
                <th className="font-medium">تعديل المخزون</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && <tr><td colSpan={4} className="py-10 text-center text-slate-400">لا توجد أصناف</td></tr>}
              {items.map(i => (
                <tr key={i.id} className="bg-slate-50 hover:bg-slate-100 transition-colors">
                  <td className="px-2 py-2 font-medium text-slate-700">{i.name}</td>
                  <td className="px-2 py-2 font-mono text-[13px] text-emerald-700">{i.quantity}</td>
                  <td className="px-2 py-2 text-center">{i.imageUrl ? <a href={i.imageUrl} target="_blank" className="text-emerald-600 hover:underline text-[12px]">عرض</a> : <span className="text-slate-400 text-[11px]">—</span>}</td>
                  <td className="px-2 py-2"><AdjustStockControls itemId={i.id} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
