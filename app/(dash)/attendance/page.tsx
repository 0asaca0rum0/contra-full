import { getBaseUrl } from '@/lib/baseUrl';
import { cookies } from 'next/headers';
import AttendanceControls from '@/components/projects/AttendanceControls';
import { FaUsers, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import AccountingExportButton from '@/components/accounting/AccountingExportButton';
import AttendanceFilters from '@/components/attendance/AttendanceFilters';
import SectionCard from '@/components/ui/SectionCard';

export const metadata = { title: 'الحضور العام' };

async function getData(date?: string) {
  const base = await getBaseUrl();
  const ck = await cookies();
  const cookieHeader = ck.toString();
  const headers = { ...(cookieHeader ? { cookie: cookieHeader } : {}) };

  const [projectsRes, employeesRes, attendanceRes] = await Promise.all([
    fetch(`${base}/api/projects`, { cache: 'no-store', headers }),
    fetch(`${base}/api/employees`, { cache: 'no-store', headers }),
    fetch(`${base}/api/attendance${date ? `?date=${date}` : ''}`, { cache: 'no-store', headers }),
  ]);

  const projects = projectsRes.ok ? (await projectsRes.json()).projects || [] : [];
  const employees = employeesRes.ok ? (await employeesRes.json()).employees || [] : [];
  const attendance = attendanceRes.ok ? (await attendanceRes.json()).attendance || [] : [];

  return { projects, employees, attendance };
}

export default async function AttendancePage({ searchParams }: { searchParams: any }) {
  const sp = await searchParams;
  const dateStr = sp.date || new Date().toISOString().split('T')[0];
  const selectedProjectId = sp.projectId || '';

  const { projects, employees, attendance } = await getData(dateStr);

  const projectMap = new Map<string, string>(projects.map((p: any) => [String(p.id), String(p.name)]));

  const filteredEmployees = selectedProjectId 
    ? employees.filter((e: any) => e.projectId === selectedProjectId)
    : employees;

  const attendanceMap = new Map(attendance.map((a: any) => [String(a.employee_id || a.employeeId), a]));
  
  const stats = filteredEmployees.reduce((acc: any, emp: any) => {
    const record = attendanceMap.get(emp.id) as any;
    if (record) {
      if (record.present) acc.present++;
      else acc.absent++;
    } else {
      acc.missing++;
    }
    return acc;
  }, { present: 0, absent: 0, missing: 0 });

  const exportRows = filteredEmployees.map((emp: any) => {
    const record = attendanceMap.get(emp.id) as any;
    return {
      'الاسم': emp.name,
      'المشروع': projectMap.get(emp.projectId) || emp.projectId,
      'الحالة': record ? (record.present ? 'حاضر' : 'غائب') : 'غير مسجل',
      'التاريخ': dateStr
    };
  });

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">سجل الحضور العام</h1>
          <p className="text-sm font-bold text-emerald-600 uppercase tracking-widest">متابعة حضور العمال في جميع المشاريع</p>
        </div>
        <div className="flex items-center gap-4">
          <AccountingExportButton 
            filename={`حضور_${dateStr}`} 
            text="تصدير السجل" 
            sheets={[{ sheet: 'الحضور', rows: exportRows }]} 
          />
        </div>
      </div>

      {/* Filters (Client Component) */}
      <AttendanceFilters 
        projects={projects} 
        selectedProjectId={selectedProjectId} 
        dateStr={dateStr} 
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <SectionCard>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-slate-500 text-[10px] font-black uppercase tracking-widest">
              <FaUsers className="text-slate-400 text-lg" /> إجمالي العمال
            </div>
            <div className="text-4xl font-black text-slate-900 tracking-tighter">{filteredEmployees.length}</div>
          </div>
        </SectionCard>
        <SectionCard variant="glass">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-emerald-700 text-[10px] font-black uppercase tracking-widest">
              <FaCheckCircle className="text-emerald-600 text-lg" /> الحاضرون
            </div>
            <div className="text-4xl font-black text-emerald-900 tracking-tighter">{stats.present}</div>
          </div>
        </SectionCard>
        <SectionCard className="!bg-rose-50 !border-rose-100">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-rose-700 text-[10px] font-black uppercase tracking-widest">
              <FaTimesCircle className="text-rose-600 text-lg" /> الغائبون
            </div>
            <div className="text-4xl font-black text-rose-900 tracking-tighter">{stats.absent}</div>
          </div>
        </SectionCard>
        <SectionCard>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest">
              <div className="w-4 h-4 rounded-full bg-slate-200 border border-slate-300" /> غير مسجلين
            </div>
            <div className="text-4xl font-black text-slate-900 tracking-tighter">{stats.missing}</div>
          </div>
        </SectionCard>
      </div>

      {/* Attendance Controls - High Focus Area (Dark) */}
      <SectionCard variant="dark" className="!p-0 overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-white/5 bg-white/5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-10 w-2 bg-emerald-500 rounded-full" />
            <h2 className="text-2xl font-black text-white tracking-tight">قائمة العمال</h2>
          </div>
          {selectedProjectId && (
            <span className="px-6 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-sm font-black text-emerald-400 tracking-wide">
              {projectMap.get(selectedProjectId) || ''}
            </span>
          )}
        </div>
        <div className="p-8">
          <AttendanceControls 
            employees={filteredEmployees} 
            attendance={attendance} 
            date={dateStr}
          />
        </div>
      </SectionCard>
    </div>
  );
}
