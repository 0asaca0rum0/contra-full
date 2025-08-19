import SectionCard from '@/components/ui/SectionCard';
import Identicon from '@/components/ui/Identicon';
import Link from 'next/link';
import { FaArrowRightLong, FaMoneyBillTrendUp } from 'react-icons/fa6';
import { getBaseUrl } from '@/lib/baseUrl';
import { cookies } from 'next/headers';
import { MdAssignment, MdHistory } from 'react-icons/md';
import AccountingExportButton from '@/components/accounting/AccountingExportButton';

export const dynamic = 'force-dynamic';

async function getOverview(userId: string) {
  try {
    const base = await getBaseUrl();
    const cookieHeader = (await cookies()).toString();
    const url = `${base}/api/pm/${userId}/overview`;
    console.log('[PM_OVERVIEW_PAGE_FETCH]', { url, userId });
    const res = await fetch(url, { cache: 'no-store', headers: { 'x-debug': '1', ...(cookieHeader ? { cookie: cookieHeader } : {}) } });
    if (!res.ok) {
      console.error('[PM_OVERVIEW_PAGE_FETCH_STATUS]', res.status);
      return { error: true, projects: [], username: null };
    }
    const json = await res.json();
    console.log('[PM_OVERVIEW_PAGE_FETCH_OK]', { projectCount: json.projects?.length });
    return json;
  } catch (e) {
    console.error('[PM_OVERVIEW_PAGE_FETCH_EXCEPTION]', e);
    return { error: true, projects: [], username: null };
  }
}

// Loosen typing to satisfy custom PageProps expectation (params may be a Promise)
export default async function PMPage(props: any) {
	const raw = props?.params;
	const resolved = raw && typeof raw.then === 'function' ? await raw : raw;
	const userId: string = resolved?.userId;
  const data = await getOverview(userId);
  if ((data as any).error) {
    return (
      <div className="space-y-8">
        <h1 className="text-2xl font-bold text-rose-600">تعذر تحميل بيانات مدير المشروع</h1>
        <p className="text-sm text-slate-500">حاول إعادة تحميل الصفحة أو تحقق من السجل.</p>
        <Link href="/pm" className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors w-fit"><FaArrowRightLong className="rotate-180" /> رجوع</Link>
      </div>
    );
  }
	const projectSheets = (data.projects || []).map((p: any)=>({ projectId: p.projectId, projectName: p.projectName, totalProjectBudget: p.totalProjectBudget, currentBudget: p.currentBudget, projectSpent: p.projectSpent }));
	// Flatten history & expenses for all projects for export
	const historySheet = (data.projects || []).flatMap((p:any)=>(p.history||[]).map((h:any)=>({ projectId: p.projectId, changedAt: h.changedAt, oldBudget: h.oldBudget, newBudget: h.newBudget, delta: h.delta })));
	const expensesSheet = (data.projects || []).flatMap((p:any)=>(p.expenses||[]).map((e:any)=>({ projectId: p.projectId, id: e.id, amount: e.amount, description: e.description, createdAt: e.createdAt })));
	return (
		<div className="space-y-12">
			<div className="flex items-start justify-between flex-wrap gap-8">
				<div className="flex items-center gap-6">
					<Identicon seed={userId} size={88} />
					<div className="space-y-2">
						<h1 className="text-3xl font-bold flex items-center gap-3 text-slate-800 tracking-tight">
							<MdAssignment className="text-emerald-500" />
							مدير المشروع
						</h1>
						<div className="text-lg text-slate-600">
							اسم المستخدم:{" "}
							<span className="font-semibold text-emerald-600">
								{data.username || userId}
							</span>
						</div>
					</div>
				</div>
				<div className="flex items-center gap-3">
					<AccountingExportButton
						filename={`تقرير_المدير_${userId}`}
						text="تصدير"
						sheets={[
							{ sheet: 'المشاريع', rows: projectSheets },
							{ sheet: 'سجل_المخصصات', rows: historySheet },
							{ sheet: 'المصروفات', rows: expensesSheet },
						]}
					/>
					<Link
							href="/pm"
							className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors h-fit"
						>
							<FaArrowRightLong className="rotate-180" /> المديرون
						</Link>
				</div>
			</div>

			<SectionCard>
				<h2 className="font-semibold mb-8 flex items-center gap-2 text-base text-slate-700">
					<FaMoneyBillTrendUp className="text-emerald-500" /> المشاريع المرتبطة
				</h2>
				<div
					className={`grid gap-10 ${
						data.projects.length > 1
							? "sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
							: "grid-cols-1"
					}`}
				>
					{data.projects.length === 0 && (
						<div className="text-base text-[var(--color-text-secondary)]">
							لا يوجد مشاريع مرتبطة بهذا المدير حالياً
						</div>
					)}
					{data.projects.map((p: any) => (
						<div
							key={p.projectId}
							className="group relative flex flex-col gap-8 rounded-2xl border border-slate-200 bg-white px-8 pt-8 pb-9 hover:shadow-xl shadow transition-colors overflow-hidden"
						>
							<div className="flex items-start justify-between gap-8">
								<div className="flex items-center gap-5">
									<Identicon seed={`${p.projectId}-${userId}`} size={64} />
									<div className="flex flex-col gap-1.5">
										<Link
											href={`/projects/${p.projectId}`}
											className="font-bold hover:underline text-[18px] tracking-tight text-slate-800 leading-tight break-words"
										>
											{p.projectName}
										</Link>
									</div>
								</div>
								<div className="flex flex-col items-end min-w-[90px]">
									<span className="text-[12px] text-slate-500 mb-1">
										الحالي
									</span>
									<span className="px-3 py-1.5 rounded-lg text-[15px] bg-emerald-500/10 text-emerald-700 font-mono font-semibold leading-none">
										{p.totalProjectBudget}
									</span>
								</div>
							</div>
							<div className="flex flex-wrap gap-4 text-[14px] font-medium">
								<div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 px-6 py-4 bg-slate-50/60 min-w-[140px] h-28">
									<span className="text-[12px] text-slate-600 mb-1">
										إجمالي
									</span>
									<span className="text-slate-800 font-bold text-2xl leading-none">
										{p.totalProjectBudget}
									</span>
								</div>
								<div className="flex flex-col items-center justify-center rounded-xl border border-emerald-200 px-6 py-4 bg-emerald-50/50 min-w-[140px] h-28">
									<span className="text-[12px] text-emerald-600 mb-1">
										مخصص
									</span>
									<span className="text-emerald-700 font-bold text-2xl leading-none">
										{p.currentBudget}
									</span>
								</div>
								<div className="flex flex-col items-center justify-center rounded-xl border border-rose-200 px-6 py-4 bg-rose-50/50 min-w-[140px] h-28">
									<span className="text-[12px] text-rose-600 mb-1">مصروف</span>
									<span className="text-rose-700 font-bold text-2xl leading-none">
										{p.projectSpent}
									</span>
								</div>
							</div>
							<div className="mt-6 w-full grid gap-8 md:grid-cols-2">
								<div className="flex flex-col min-w-0">
									<div className="flex items-center gap-2 text-[14px] font-semibold text-slate-600 mb-3">
										<MdHistory className="text-emerald-500" />
										سجل المخصصات
									</div>
									<ul className="space-y-1.5 max-h-60 overflow-auto pr-1 rounded">
										{p.history.length === 0 && (
											<li className="text-[13px] text-[var(--color-text-secondary)]">
												لا يوجد سجل
											</li>
										)}
										{p.history.map((h: any) => (
											<li
												key={h.id}
												className="flex items-center justify-between text-[13px] py-1.5 px-3 rounded-lg bg-slate-50 border border-slate-200/60"
											>
												<span className="text-slate-500 font-medium min-w-[80px]">
													{h.changedAt
														? new Date(h.changedAt).toLocaleDateString("ar")
														: ""}
												</span>
												<span className="font-mono text-emerald-600">
													{h.delta >= 0 ? "+" : ""}
													{h.delta}
												</span>
												<span className="font-semibold text-slate-700">
													{h.newBudget}
												</span>
											</li>
										))}
									</ul>
								</div>
								<div className="flex flex-col min-w-0">
									<div className="flex items-center gap-2 text-[14px] font-semibold text-slate-600 mb-3">
										<MdHistory className="text-emerald-500" />
										سجل المصروفات
									</div>
									<ul className="space-y-1.5 max-h-60 overflow-auto pr-1 rounded">
										{(p.expenses?.length ?? 0) === 0 && (
											<li className="text-[13px] text-[var(--color-text-secondary)]">
												لا يوجد مصروفات
											</li>
										)}
										{p.expenses?.map((e: any) => (
											<li
												key={e.id}
												className="grid grid-cols-[80px_70px_1fr_auto] items-center gap-3 text-[13px] py-1.5 px-3 rounded-lg bg-white border border-slate-200/60 shadow-sm"
											>
												<span className="text-slate-500 font-medium truncate">
													{e.createdAt
														? new Date(e.createdAt).toLocaleDateString("ar")
														: ""}
												</span>
												<span className="font-mono font-semibold text-rose-600">
													{e.amount}
												</span>
												<span className="truncate" title={e.description}>
													{e.description}
												</span>
												{e.receiptUrl ? (
													<Link
														href={e.receiptUrl}
														target="_blank"
														className="text-xs text-emerald-600 hover:underline whitespace-nowrap"
													>
														إيصال
													</Link>
												) : (
													<span className="text-[10px] text-slate-400">—</span>
												)}
											</li>
										))}
									</ul>
								</div>
							</div>
						</div>
					))}
				</div>
			</SectionCard>
		</div>
	);
}
