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
	const pmUsers: Array<{ id: string; username: string; role: string }> =
		pmUsersAll || [];
	const pmIds = new Set<string>(
		(members.managers || []).map((m: any) => String(m.userId))
	);
	const pmList = pmUsers.filter((u) => pmIds.has(u.id)); // Only PMs assigned to this project
	const usernameMap = new Map(pmUsers.map((u) => [u.id, u.username] as const));
	// Prepare export sheets
	const budgetSheet = [{ totalBudget: budget.totalBudget, spent: budget.spent, remaining: budget.remaining }];
	const allocationsSheet = (pmAllocData.allocations || []).map((a: any)=>({ userId: a.userId, budget: a.budget }));
	const allocHistorySheet = (pmAllocData.history || []).map((h: any)=>({ userId: h.userId, oldBudget: h.oldBudget, newBudget: h.newBudget, delta: (h.delta ?? ((h.oldBudget==null)?h.newBudget:(h.newBudget - h.oldBudget))), changedAt: h.changedAt }));
	const expensesSheet = (expenses || []).map((e: any)=>({ id: e.id, amount: e.amount, description: e.description, createdAt: e.createdAt || e.created_at }));
	const attendanceSheet = (attendance || []).map((a: any)=>({ employeeId: a.employee_id || a.employeeId, status: a.status || a.state || (a.present ? 'حاضر':'غائب'), date: a.date }));
	const managersSheet = (pmList || []).map((m: any)=>({ userId: m.id, username: m.username, role: m.role }));
	return (
		<div className="space-y-6">
			<div className="flex items-center justify-end">
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
			</div>
			<div className="flex items-start justify-between gap-3">
				<div>
					<h1 className="text-2xl section-title">{project.name}</h1>
					<div className="text-sm text-[var(--color-text-secondary)]">
						معرّف المشروع: {project.id}
					</div>
				</div>
				<Link
					href="/projects"
					className="underline text-[var(--color-primary)]"
				>
					عودة إلى المشاريع
				</Link>
			</div>

			<SectionCard delay={0.05}>
				<h2 className="font-semibold mb-2 flex items-center gap-2">
					<FaMoneyBillTrendUp className="text-emerald-400" /> الميزانية
				</h2>
				<div className="grid grid-cols-3 gap-3 text-sm">
					<div>الإجمالي: {budget.totalBudget ?? 0}</div>
					<div>المصروف: {budget.spent ?? 0}</div>
					<div>المتبقي: {budget.remaining ?? 0}</div>
				</div>
				<div className="mt-4 text-sm space-y-1">
					<div className="font-medium">تفاصيل مخصصات المدراء</div>
					<div className="grid grid-cols-3 gap-3">
						<div>المخصص الكلي: {pmAllocData?.summary?.allocated ?? 0}</div>
						<div>المصروف: {pmAllocData?.summary?.spent ?? 0}</div>
						<div>المتبقي: {pmAllocData?.summary?.remaining ?? 0}</div>
					</div>
					<div className="mt-3">
						{/* Allocation form should list only PMs already assigned to project */}
						<AllocationForm projectId={projectId} pmUsers={pmList} />
						{(pmAllocData?.pendingMigration || budget?.pendingMigration) && (
							<div className="mt-3 p-2 rounded bg-amber-500/10 border border-amber-400/40 text-amber-700 text-xs">
								يتعذر استخدام المخصصات حالياً لأن ترقية قاعدة البيانات
								(pm_budgets) غير مطبقة. شغّل أمر الهجرة ثم حدّث الصفحة.
							</div>
						)}
					</div>
					<div className="mt-3 grid md:grid-cols-2 gap-4">
						<div>
							<h3 className="font-medium mb-2 text-sm">
								المخصص الحالي لكل مدير
							</h3>
							<ul className="text-xs space-y-1 max-h-56 overflow-auto pr-1">
								{(pmAllocData.allocations || []).length === 0 && (
									<li className="text-[var(--color-text-secondary)]">
										لا توجد مخصصات
									</li>
								)}
								{(pmAllocData.allocations || []).map((a: any) => {
									const uname = usernameMap.get(a.userId) || a.userId;
									return (
										<li
											key={a.id}
											className="flex items-center justify-between gap-2"
										>
											<div className="flex items-center gap-2 min-w-0">
												<Identicon
													seed={`${projectId}-${a.userId}`}
													size={22}
												/>
												<span className="truncate max-w-[120px]" title={uname}>
													{uname}
												</span>
											</div>
											<span className="font-medium">{a.budget}</span>
										</li>
									);
								})}
							</ul>
						</div>
						<div>
							<h3 className="font-medium mb-2 text-sm">سجل التعديلات</h3>
							<ul className="text-xs space-y-1 max-h-56 overflow-auto pr-1">
								{(pmAllocData.history || []).length === 0 && (
									<li className="text-[var(--color-text-secondary)]">
										لا يوجد سجل
									</li>
								)}
								{(pmAllocData.history || []).map((h: any) => {
									const uname = usernameMap.get(h.userId) || h.userId;
									const dateLabel = h.changedAt
										? new Date(h.changedAt).toLocaleDateString("ar")
										: "";
									const delta =
										h.delta ??
										(h.oldBudget == null
											? h.newBudget
											: h.newBudget - h.oldBudget);
									return (
										<li
											key={h.id}
											className="flex items-center justify-between gap-2 px-1 py-0.5 rounded hover:bg-emerald-50/40 dark:hover:bg-emerald-900/20 transition-colors"
										>
											<div className="flex items-center gap-2 min-w-0">
												<Identicon
													seed={`${projectId}-${h.userId}`}
													size={18}
												/>
												<div className="flex flex-col leading-tight min-w-0">
													<span
														className="truncate max-w-[120px]"
														title={uname}
													>
														{uname}
													</span>
													{dateLabel && (
														<span className="text-[10px] text-[var(--color-text-secondary)]">
															{dateLabel}
														</span>
													)}
												</div>
											</div>
											<div className="flex items-center gap-2 font-mono rtl:space-x-reverse">
												<span className="text-emerald-600 font-semibold">
													+{delta}
												</span>
												<span className="text-[var(--color-text-secondary)]">
													=
												</span>
												<span className="font-bold">{h.newBudget}</span>
											</div>
										</li>
									);
								})}
							</ul>
						</div>
					</div>
				</div>
			</SectionCard>

			<SectionCard delay={0.1}>
				<h2 className="font-semibold mb-3 flex items-center gap-2">
					<FaUserTie className="text-emerald-400" /> مديرو المشروع
				</h2>
				<ul className="text-sm mb-3 list-disc pr-5">
					{pmList.length === 0 && (
						<li className="text-[var(--color-text-secondary)]">
							لا يوجد مديرون مضافون بعد
						</li>
					)}
					{pmList.map((u) => (
						<li key={u.id}>
							{u.username}{" "}
							<span className="text-xs text-[var(--color-text-secondary)]">
								({u.role})
							</span>
						</li>
					))}
				</ul>
				<ProjectMembersManager
					projectId={projectId}
					pmUsers={pmUsers}
					initialManagerIds={Array.from(pmIds.values()) as string[]}
				/>
			</SectionCard>

			<SectionCard delay={0.15}>
				<h2 className="font-semibold mb-3 flex items-center gap-2">
					<FaUsersGear className="text-emerald-400" /> الموظفون
				</h2>
				<EmployeeListWithCrud
					employees={members.employees || []}
					projectId={projectId}
				/>
				<AddEmployeeForm projectId={projectId} />
				<AttendanceControls
					employees={(members.employees || []).map((e: any) => ({ id: e.id, name: e.name }))}
					attendance={attendance}
				/>
			</SectionCard>

			<SectionCard delay={0.2}>
				<h2 className="font-semibold mb-3 flex items-center gap-2">
					<MdAccessTime className="text-emerald-400" /> الحضور (اليوم)
				</h2>
				<ul className="text-sm space-y-1">
					{attendance.length === 0 && (
						<li className="text-[var(--color-text-secondary)]">
							لا توجد سجلات حضور اليوم
						</li>
					)}
					{attendance.map((a: any) => (
						<li key={a.id ?? `${a.employee_id}-${a.date}`}>
							الموظف #{a.employee_id} — الحالة: {a.status ?? a.state ?? (a.present ? 'حاضر' : 'غائب')} —{" "}
							{new Date(a.date).toLocaleString("ar")}
						</li>
					))}
				</ul>
				<AttendanceHistory projectId={projectId} />
			</SectionCard>

			<SectionCard delay={0.25}>
				<h2 className="font-semibold mb-3 flex items-center gap-2">
					<FaListCheck className="text-emerald-400" /> المصروفات
				</h2>
				{/* Expense form should also limit selectable PMs to those on the project */}
				<ProjectExpenseForm projectId={projectId} pmUsers={pmList} />
				<div className="mt-4">
					<h3 className="font-medium mb-2 text-sm">آخر المصروفات</h3>
					<ul className="text-sm space-y-1">
						{expenses.length === 0 && (
							<li className="text-[var(--color-text-secondary)]">
								لا توجد مصروفات
							</li>
						)}
						{expenses.map((x: any) => (
							<li key={x.id} className="flex items-center justify-between">
								<span className="text-[var(--color-text-secondary)]">
									{new Date(
										x.createdAt ?? x.created_at ?? Date.now()
									).toLocaleString("ar")}
								</span>
								<span className="font-medium">{x.amount}</span>
								<span>{x.description}</span>
							</li>
						))}
					</ul>
				</div>
			</SectionCard>

			{/* Suppliers section removed as per request */}
		</div>
	);
}

