import { getBaseUrl } from '@/lib/baseUrl';
import SectionCard from '@/components/ui/SectionCard';
import Identicon from '@/components/ui/Identicon';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { FaTruckMoving, FaMoneyBillTrendUp } from 'react-icons/fa6';
import AccountingExportButton from '@/components/accounting/AccountingExportButton';
import SupplierManager from '@/components/suppliers/SupplierManager';
import SuppliersDirectory from '@/components/suppliers/SuppliersDirectory';

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
  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-semibold flex items-center gap-2 text-slate-800">
          <FaTruckMoving className="text-emerald-500" /> الموردون
        </h1>
        <div className="flex items-center gap-3">
          <AccountingExportButton
            filename="تقرير_الموردين"
            text="تصدير"
            sheets={[{ sheet: 'الموردون', rows: suppliersExport }]}
            endpoints={[{ url: '/api/transactions?limit=100', sheet: 'أحدث_المعاملات' }]}
          />
          <Link href="/projects" className="text-sm px-3 py-1.5 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors">المشاريع</Link>
        </div>
      </div>

      <SectionCard>
        <div className="mb-10">
          <SupplierManager />
        </div>
        <SuppliersDirectory suppliers={suppliers} />
      </SectionCard>
    </div>
  );
}
