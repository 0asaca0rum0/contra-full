import { getBaseUrl } from '@/lib/baseUrl';
import SectionCard from '@/components/ui/SectionCard';
import Link from 'next/link';
import { cookies } from 'next/headers';
import UsersManager from '@/components/admin/UsersManager';

export const metadata = { title: 'اللوحة الرئيسية' };
export const dynamic = 'force-dynamic';

async function fetchAll() {
  const base = await getBaseUrl();
  const cookieHeader = (await cookies()).toString();
  const headers: Record<string, string> = {};
  if (cookieHeader) headers.cookie = cookieHeader;
  try {
    console.log('[DASH_FETCH_START]', { base });
    const [usersRes, employeesRes, attendanceRes, transactionsRes, warehouseRes, projectsRes] = await Promise.all([
      fetch(`${base}/api/admin/users`, { cache: 'no-store', headers }),
      fetch(`${base}/api/employees`, { cache: 'no-store', headers }),
      fetch(`${base}/api/attendance`, { cache: 'no-store', headers }),
      fetch(`${base}/api/transactions?limit=10`, { cache: 'no-store', headers }),
      fetch(`${base}/api/warehouse/items`, { cache: 'no-store', headers }),
      fetch(`${base}/api/projects`, { cache: 'no-store', headers }),
    ]);
  const usersData = usersRes.ok ? await usersRes.json() : { users: [] };
  const canManageUsers = usersRes.ok; // 200 only if admin/mod
    const employeesData = employeesRes.ok ? await employeesRes.json() : { employees: [] };
    const attendanceData = attendanceRes.ok ? await attendanceRes.json() : { attendance: [] };
    const txData = transactionsRes.ok ? await transactionsRes.json() : { transactions: [] };
    const warehouseData = warehouseRes.ok ? await warehouseRes.json() : { items: [] };
  const projectsData = projectsRes.ok ? await projectsRes.json() : { projects: [] };
  console.log('[DASH_FETCH_OK]', { users: usersData.users?.length, employees: employeesData.employees?.length, projects: projectsData.projects?.length });
  return { users: usersData.users || [], employees: employeesData.employees || [], attendance: attendanceData.attendance || [], transactions: txData.transactions || [], items: warehouseData.items || warehouseData.warehouseItems || [], projects: projectsData.projects || [], canManageUsers };
  } catch (e) {
    console.error('[DASH_FETCH_EXCEPTION]', e);
    return { users: [], employees: [], attendance: [], transactions: [], items: [] };
  }
}

function percent(part: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

export default async function Page() {
  const { users, employees, attendance, transactions, items, projects, canManageUsers } = await fetchAll();
  const projectNameMap = new Map<string, string>(projects.map((p: any) => [p.id, p.name]));
  const grouped = {
    ADMIN: users.filter((u: any) => u.role === 'ADMIN'),
    MOD: users.filter((u: any) => u.role === 'MOD'),
    PM: users.filter((u: any) => u.role === 'PM'),
  };
  const presentToday = attendance.filter((a: any) => a.present).length;
  const attendancePct = percent(presentToday, employees.length);
  const latestTx = transactions.slice(0, 5);
  const totalSpentToday = transactions
    .filter((t: any) => {
      const d = new Date(t.createdAt);
      const now = new Date();
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
    })
    .reduce((sum: number, t: any) => sum + t.amount, 0);
  const lowStock = items.filter((i: any) => i.quantity <= 5).slice(0, 5);

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-slate-800">اللوحة الرئيسية</h1>
        <div className="flex flex-wrap gap-2 text-[11px] font-medium text-slate-500">
          <span>المستخدمون: {users.length}</span>
          <span>| عمال: {employees.length}</span>
          <span>| حضور اليوم: {presentToday}/{employees.length} ({attendancePct}%)</span>
          <span>| أصناف المخزن: {items.length}</span>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <SectionCard>
          <div className="flex flex-col gap-3">
            <div className="text-sm text-slate-500">الحضور اليوم</div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-emerald-600">{attendancePct}%</span>
              <span className="text-xs text-slate-500">{presentToday} / {employees.length}</span>
            </div>
            <Link href="/attendance" className="text-[12px] text-emerald-600 hover:underline self-start">تفاصيل الحضور →</Link>
          </div>
        </SectionCard>
        <SectionCard>
          <div className="flex flex-col gap-3">
            <div className="text-sm text-slate-500">المعاملات اليوم</div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-rose-600">{totalSpentToday}</span>
            </div>
            <Link href="/receipts" className="text-[12px] text-rose-600 hover:underline self-start">تفاصيل المعاملات →</Link>
          </div>
        </SectionCard>
        <SectionCard>
          <div className="flex flex-col gap-3">
            <div className="text-sm text-slate-500">إداريون / مشرفون / مديرو مشاريع</div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-slate-800">{grouped.ADMIN.length}</span>
              <span className="text-xs text-slate-500">+{grouped.MOD.length} مشرف</span>
              <span className="text-xs text-slate-500">+{grouped.PM.length} مدير</span>
            </div>
            {canManageUsers && <a href="#users-admin" className="text-[12px] text-slate-600 hover:underline self-start">إدارة المستخدمين ↓</a>}
          </div>
        </SectionCard>
        <SectionCard>
          <div className="flex flex-col gap-3">
            <div className="text-sm text-slate-500">أصناف منخفضة</div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-amber-600">{lowStock.length}</span>
            </div>
            <Link href="/warehouse" className="text-[12px] text-amber-600 hover:underline self-start">المخزن →</Link>
          </div>
        </SectionCard>
      </div>

      {/* Latest transactions & low stock */}
      <div className="grid gap-6 xl:grid-cols-3">
        <SectionCard className="xl:col-span-2">
          <h2 className="font-semibold mb-4 text-base text-slate-700">أحدث المعاملات</h2>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-right text-[11px] text-slate-500">
                  <th className="font-medium py-2">الوصف</th>
                  <th className="font-medium py-2">المبلغ</th>
                  <th className="font-medium py-2">التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {latestTx.length === 0 && <tr><td colSpan={3} className="py-6 text-center text-slate-400 text-[13px]">لا يوجد</td></tr>}
                {latestTx.map((t: any) => (
                  <tr key={t.id} className="border-t border-slate-100/60 hover:bg-slate-50">
                    <td className="py-2 pr-2 font-medium text-slate-700 whitespace-nowrap max-w-[220px] truncate">{t.description}</td>
                    <td className="py-2 pr-2 font-mono text-[13px] text-rose-600">{t.amount}</td>
                    <td className="py-2 pr-2 text-[11px] text-slate-500">{t.createdAt ? new Date(t.createdAt).toLocaleDateString('ar') : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
        <SectionCard>
          <h2 className="font-semibold mb-4 text-base text-slate-700">أصناف المخزون المنخفضة</h2>
          <ul className="space-y-2 max-h-80 overflow-auto pr-1">
            {lowStock.length === 0 && <li className="text-[13px] text-slate-400">لا يوجد أصناف منخفضة الآن</li>}
            {lowStock.map((i: any) => (
              <li key={i.id} className="flex items-center justify-between text-[13px] bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                <span className="font-medium text-slate-700 truncate">{i.name}</span>
                <span className="font-mono text-amber-600">{i.quantity}</span>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

  {/* Users & employees breakdown */}
      <div className="grid gap-6 md:grid-cols-2">
        <SectionCard>
          <h2 className="font-semibold mb-4 text-base text-slate-700">أدوار المستخدمين</h2>
          <div className="space-y-4">
            <div>
              <div className="text-[12px] text-slate-500 mb-1">الإداريون</div>
              <div className="flex flex-wrap gap-2">
                {grouped.ADMIN.map((u: any) => <span key={u.id} className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px]">{u.username}</span>)}
                {grouped.ADMIN.length === 0 && <span className="text-[11px] text-slate-400">لا يوجد</span>}
              </div>
            </div>
            <div>
              <div className="text-[12px] text-slate-500 mb-1">المشرفون</div>
              <div className="flex flex-wrap gap-2">
                {grouped.MOD.map((u: any) => <span key={u.id} className="px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-[11px]">{u.username}</span>)}
                {grouped.MOD.length === 0 && <span className="text-[11px] text-slate-400">لا يوجد</span>}
              </div>
            </div>
            <div>
              <div className="text-[12px] text-slate-500 mb-1">مديرو المشاريع</div>
              <div className="flex flex-wrap gap-2">
                {grouped.PM.map((u: any) => <span key={u.id} className="px-3 py-1 rounded-full bg-cyan-100 text-cyan-800 text-[11px]">{u.username}</span>)}
                {grouped.PM.length === 0 && <span className="text-[11px] text-slate-400">لا يوجد</span>}
              </div>
            </div>
          </div>
        </SectionCard>
        <SectionCard>
          <h2 className="font-semibold mb-4 text-base text-slate-700">العمال</h2>
          <ul className="grid sm:grid-cols-2 gap-2 max-h-72 overflow-auto pr-1">
            {employees.map((e: any) => (
              <li key={e.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3 flex flex-col gap-1">
                <span className="font-medium text-[13px] text-slate-700">{e.name}</span>
                <span className="text-[11px] text-slate-500">مشروع: {projectNameMap.get(e.projectId) || e.projectId}</span>
              </li>
            ))}
            {employees.length === 0 && <li className="text-[11px] text-slate-400">لا يوجد عمال</li>}
          </ul>
        </SectionCard>
      </div>

      {canManageUsers && (
        <div id="users-admin" className="scroll-mt-24">
          <SectionCard>
            <h2 className="font-semibold mb-4 text-base text-slate-700">إدارة المستخدمين</h2>
            <UsersManager />
          </SectionCard>
        </div>
      )}
    </div>
  );
}
