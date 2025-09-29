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
        <h2 className="mb-4 text-base font-semibold text-slate-700">الأصناف</h2>
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-6 py-16 text-center text-sm text-slate-500">
            لا توجد أصناف في المخزن حالياً.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <article
                key={item.id}
                className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <WarehouseImage imageUrl={item.imageUrl} name={item.name} />
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-slate-800" title={item.name}>
                      {item.name}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      الكمية الحالية: <span className="font-mono text-emerald-700">{item.quantity}</span>
                    </p>
                  </div>
                </div>
                <div className="mt-auto">
                  <AdjustStockControls itemId={item.id} />
                </div>
                {item.imageUrl && (
                  <a
                    href={item.imageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700"
                  >
                    فتح الصورة بالحجم الكامل →
                  </a>
                )}
              </article>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

function WarehouseImage({ imageUrl, name }: { imageUrl: string | null | undefined; name: string }) {
  if (!imageUrl) {
    return (
      <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-[10px] text-slate-400">
        بدون صورة
      </div>
    );
  }

  return (
    <div className="relative h-16 w-16 overflow-hidden rounded-xl border border-slate-200">
      <img
        src={imageUrl}
        alt={name}
        className="h-full w-full object-cover"
        loading="lazy"
      />
    </div>
  );
}
