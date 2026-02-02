import Link from "next/link";
import ProjectMembersManager from "../../../../components/projects/ProjectMembersManager";
import ProjectExpenseForm from "../../../../components/projects/ProjectExpenseForm";
import AllocationForm from "@/components/projects/AllocationForm";
import SectionCard from "@/components/ui/SectionCard";
import Identicon from "@/components/ui/Identicon";
import {
	FaMoneyBillTrendUp,
	FaUsersGear,
	FaUserTie,
	FaListCheck,
} from "react-icons/fa6";
import { getBaseUrl } from "@/lib/baseUrl";
import { cookies } from "next/headers";
import { MdAccessTime } from "react-icons/md";
import AddEmployeeForm from "@/components/projects/AddEmployeeForm";
import AttendanceControls from "@/components/projects/AttendanceControls";
import EmployeeListWithCrud from "../../../../components/projects/EmployeeListWithCrud";
import AttendanceHistory from "@/components/projects/AttendanceHistory";
import AccountingExportButton from '@/components/accounting/AccountingExportButton';
export const metadata = { title: "تفاصيل المشروع" };

async function getAll(projectId: string) {
	const base = await getBaseUrl();
	const ck = await cookies();
	const cookieHeader = ck
		.getAll()
		.map((c: any) => `${c.name}=${c.value}`)
		.join("; ");
	const common: RequestInit = {
		cache: "no-store",
		headers: { ...(cookieHeader ? { cookie: cookieHeader } : {}) },
	};
	const urls = [
		`/api/projects/${projectId}`,
		`/api/projects/${projectId}/budget`,
		`/api/projects/${projectId}/members`,
		`/api/projects/${projectId}/expenses`,
		`/api/admin/users`,
		`/api/projects/${projectId}/attendance`,
		`/api/projects/${projectId}/pm-budgets`,
	];
	const [
		projRes,
		budgetRes,
		membersRes,
		expensesRes,
		usersRes,
		attendanceRes,
		pmBudgetsRes,
	] = await Promise.all(urls.map((u) => fetch(`${base}${u}`, common)));
	if (!projRes.ok) throw new Error("Project not found");
	const project = (await projRes.json()).project;
	const budget = budgetRes.ok
		? await budgetRes.json()
		: { totalBudget: 0, spent: 0, remaining: 0 };
	const members = membersRes.ok
		? await membersRes.json()
		: { managers: [], employees: [], users: [] };
	const expenses = expensesRes.ok
		? (await expensesRes.json()).expenses ?? []
		: [];
	const allUsers = usersRes.ok ? (await usersRes.json()).users ?? [] : [];
	const pmUsersAll = allUsers
		.filter((u: any) => u.role === "PM" || u.role === 'ADMIN')
		.map((u: any) => ({ id: u.id, username: u.username, role: u.role }));
	const attendance = attendanceRes.ok
		? (await attendanceRes.json()).attendance ?? []
		: [];
	const pmAllocData = pmBudgetsRes.ok
		? await pmBudgetsRes.json()
		: {
			allocations: [],
			summary: { allocated: 0, spent: 0, remaining: 0 },
			history: [],
		};
	return {
		project,
		budget,
		members,
		expenses,
		pmUsersAll,
		attendance,
		pmAllocData,
	};
}

export const dynamic = "force-dynamic";

type ProjectParams = { projectId: string } | Promise<{ projectId: string }>;

export default async function Page({ params }: { params: any }) {
	const maybePromise: ProjectParams = params;
	const resolved =
		typeof maybePromise === "object" && "then" in (maybePromise as any)
			? await (maybePromise as Promise<{ projectId: string }>)
			: (maybePromise as { projectId: string });
	const { projectId } = resolved;
	let data;
	try {
		data = await getAll(projectId);
	} catch (e: any) {
		return (
			<div className="space-y-6">
				<h1 className="text-2xl font-bold text-rose-600">تعذر تحميل المشروع</h1>
				<p className="text-sm text-slate-600">
					السبب: {e?.message || "غير معروف"}
				</p>
				<p className="text-sm text-slate-500">
					تأكد أن المعرّف صحيح وأن المشروع موجود.
				</p>
				<Link href="/projects" className="underline text-emerald-600">
					العودة إلى قائمة المشاريع
				</Link>
			</div>
		);
	}
	const {
		project,
		budget,
		members,
		expenses,
		pmUsersAll,
		attendance,
		pmAllocData,
	} = data;
	const expenseList: Array<{ receiptUrl?: string | null }> = Array.isArray(expenses)
		? expenses
		: [];
	const receiptUrls = expenseList
		.map((exp) => exp.receiptUrl ?? null)
		.filter((value): value is string => typeof value === 'string' && value.length > 0)
		.slice(0, 10);
	const pmUsers: Array<{ id: string; username: string; role: string }> =
		pmUsersAll || [];
	const pmIds = new Set<string>(
		(members.managers || []).map((m: any) => String(m.userId))
	);
	const pmList = pmUsers.filter((u) => pmIds.has(u.id));
	const usernameMap = new Map(pmUsers.map((u) => [u.id, u.username] as const));

	// Prepare export sheets
	const budgetSheet = [{ totalBudget: budget.totalBudget, spent: budget.spent, remaining: budget.remaining }];
	const allocationsSheet = (pmAllocData.allocations || []).map((a: any) => ({ userId: a.userId, budget: a.budget }));
	const allocHistorySheet = (pmAllocData.history || []).map((h: any) => ({ userId: h.userId, oldBudget: h.oldBudget, newBudget: h.newBudget, delta: (h.delta ?? ((h.oldBudget == null) ? h.newBudget : (h.newBudget - h.oldBudget))), changedAt: h.changedAt }));
	const expensesSheet = (expenses || []).map((e: any) => ({ id: e.id, amount: e.amount, description: e.description, createdAt: e.createdAt || e.created_at, receiptUrl: e.receiptUrl || null }));
	const attendanceSheet = (attendance || []).map((a: any) => ({ employeeId: a.employee_id || a.employeeId, status: a.status || a.state || (a.present ? 'حاضر' : 'غائب'), date: a.date }));
	const managersSheet = (pmList || []).map((m: any) => ({ userId: m.id, username: m.username, role: m.role }));

	return (
		<div className="space-y-8 pb-20">
			{/* Header */}
			<div className="flex items-start justify-between gap-4">
				<div>
					<h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">{project.name}</h1>
					<p className="text-sm font-bold text-emerald-600 uppercase tracking-widest">معرّف: {project.id}</p>
				</div>
				<div className="flex items-center gap-3">
					<AccountingExportButton
						filename={`تقرير_المشروع_${project.id}`}
						text="تصدير"
						sheets={[
							{ sheet: 'الميزانية', rows: budgetSheet },
							{ sheet: 'المخصصات', rows: allocationsSheet },
							{ sheet: 'سجل_المخصصات', rows: allocHistorySheet },
							{ sheet: 'المصروفات', rows: expensesSheet },
							{ sheet: 'الحضور', rows: attendanceSheet },
							{ sheet: 'المديرون', rows: managersSheet },
						]}
					/>
					<Link
						href="/projects"
						className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm transition-colors"
					>
						عودة
					</Link>
				</div>
			</div>

			{/* Budget Overview - Prominent */}
			<SectionCard variant="glass" delay={0.05}>
				<div className="flex items-center gap-3 mb-6">
					<div className="h-10 w-2 bg-emerald-500 rounded-full" />
					<h2 className="text-2xl font-black text-slate-900 tracking-tight">الميزانية</h2>
				</div>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
					<div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
						<div className="text-xs text-slate-500 font-semibold mb-2">الإجمالي</div>
						<div className="text-3xl font-bold text-slate-900">{budget.totalBudget ?? 0}</div>
					</div>
					<div className="bg-rose-50 rounded-xl p-6 border border-rose-200">
						<div className="text-xs text-rose-700 font-semibold mb-2">المصروف</div>
						<div className="text-3xl font-bold text-rose-900">{budget.spent ?? 0}</div>
					</div>
					<div className="bg-emerald-50 rounded-xl p-6 border border-emerald-200">
						<div className="text-xs text-emerald-700 font-semibold mb-2">المتبقي</div>
						<div className="text-3xl font-bold text-emerald-900">{budget.remaining ?? 0}</div>
					</div>
				</div>

				{/* PM Allocations - Collapsible */}
				<details className="group">
					<summary className="cursor-pointer list-none">
						<div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
							<span className="font-semibold text-slate-700">تفاصيل مخصصات المدراء</span>
							<span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
						</div>
					</summary>
					<div className="mt-4 p-4 bg-white rounded-xl border border-slate-200 space-y-4">
						<div className="grid grid-cols-3 gap-3 text-sm">
							<div>المخصص الكلي: <span className="font-bold">{pmAllocData?.summary?.allocated ?? 0}</span></div>
							<div>المصروف: <span className="font-bold">{pmAllocData?.summary?.spent ?? 0}</span></div>
							<div>المتبقي: <span className="font-bold">{pmAllocData?.summary?.remaining ?? 0}</span></div>
						</div>
						<AllocationForm projectId={projectId} pmUsers={pmList} />
						{(pmAllocData?.pendingMigration || budget?.pendingMigration) && (
							<div className="p-3 rounded-lg bg-amber-500/10 border border-amber-400/40 text-amber-700 text-xs">
								يتعذر استخدام المخصصات حالياً لأن ترقية قاعدة البيانات (pm_budgets) غير مطبقة.
							</div>
						)}
					</div>
				</details>
			</SectionCard>

			{/* Two Column Layout */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Team Section */}
				<SectionCard delay={0.1}>
					<div className="flex items-center gap-3 mb-4">
						<FaUserTie className="text-emerald-500 text-xl" />
						<h2 className="text-xl font-bold text-slate-900">الفريق</h2>
					</div>

					<div className="space-y-4">
						<div>
							<h3 className="text-sm font-semibold text-slate-600 mb-2">مديرو المشروع</h3>
							{pmList.length === 0 ? (
								<p className="text-sm text-slate-400">لا يوجد مديرون</p>
							) : (
								<ul className="text-sm space-y-1">
									{pmList.map((u) => (
										<li key={u.id} className="flex items-center gap-2">
											<Identicon seed={`${projectId}-${u.id}`} size={20} />
											<span>{u.username}</span>
											<span className="text-xs text-slate-400">({u.role})</span>
										</li>
									))}
								</ul>
							)}
							<div className="mt-3">
								<ProjectMembersManager
									projectId={projectId}
									pmUsers={pmUsers}
									initialManagerIds={Array.from(pmIds.values()) as string[]}
								/>
							</div>
						</div>

						<div className="border-t border-slate-200 pt-4">
							<h3 className="text-sm font-semibold text-slate-600 mb-2">الموظفون</h3>
							<EmployeeListWithCrud
								employees={members.employees || []}
								projectId={projectId}
							/>
							<AddEmployeeForm projectId={projectId} />
						</div>
					</div>
				</SectionCard>

				{/* Expenses Section */}
				<SectionCard delay={0.15}>
					<div className="flex items-center gap-3 mb-4">
						<FaListCheck className="text-emerald-500 text-xl" />
						<h2 className="text-xl font-bold text-slate-900">المصروفات</h2>
					</div>
					<ProjectExpenseForm projectId={projectId} pmUsers={pmList} />
					<div className="mt-4">
						<h3 className="text-sm font-semibold text-slate-600 mb-3">آخر المصروفات</h3>
						{expenses.length === 0 ? (
							<p className="text-sm text-slate-400">لا توجد مصروفات</p>
						) : (
							<ul className="text-sm space-y-2 max-h-96 overflow-y-auto">
								{expenses.slice(0, 10).map((x: any) => {
									const receiptLink = typeof x.receiptUrl === 'string' && x.receiptUrl.length > 0 ? x.receiptUrl : null;
									return (
										<li key={x.id} className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 px-3 py-2 bg-slate-50/50">
											<div className="flex flex-col gap-1 min-w-0">
												<span className="font-medium text-slate-900">{x.amount} - {x.description}</span>
												<span className="text-xs text-slate-500">
													{new Date(x.createdAt ?? x.created_at ?? Date.now()).toLocaleString("ar")}
												</span>
											</div>
											{receiptLink && (
												<a
													href={receiptLink}
													target="_blank"
													rel="noopener noreferrer"
													className="text-xs font-semibold text-emerald-600 hover:underline whitespace-nowrap"
												>
													عرض الإيصال
												</a>
											)}
										</li>
									);
								})}
							</ul>
						)}
					</div>
				</SectionCard>
			</div>

			{/* Attendance Section - Full Width */}
			<SectionCard variant="dark" delay={0.2} className="!p-0 overflow-hidden">
				<div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
					<div className="flex items-center gap-3">
						<MdAccessTime className="text-emerald-400 text-2xl" />
						<h2 className="text-2xl font-black text-white tracking-tight">الحضور</h2>
					</div>
				</div>
				<div className="p-6">
					<AttendanceControls
						employees={(members.employees || []).map((e: any) => ({ id: e.id, name: e.name }))}
						attendance={attendance}
					/>
					<div className="mt-6">
						<AttendanceHistory projectId={projectId} />
					</div>
				</div>
			</SectionCard>
		</div>
	);
}
