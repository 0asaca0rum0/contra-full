export const metadata = { title: 'المشاريع' };
import { getBaseUrl } from '@/lib/baseUrl';
import ProjectsManager from '@/components/projects/ProjectsManager';
import ProjectCard from '@/components/projects/ProjectCard';
import AccountingExportButton from '@/components/accounting/AccountingExportButton';

import { cookies } from 'next/headers';

async function getProjects() {
  const base = await getBaseUrl();
  const ck = await cookies();
  const cookieHeader = ck.getAll().map(c => `${c.name}=${c.value}`).join('; ');
  
  const url = `${base}/api/projects`;
  const res = await fetch(url, { 
    cache: 'no-store',
    headers: {
      ...(cookieHeader ? { cookie: cookieHeader } : {})
    }
  });
  if (!res.ok) throw new Error(`Failed to fetch projects: ${res.status}`);
  return res.json();
}

export default async function Page() {
  let data: { projects: Array<{ id: string; name: string; totalBudget?: number }> } = { projects: [] };
  try {
    data = await getProjects();
  } catch {}
  
  const exportRows = (data.projects || []).map((p) => ({ 
    id: p.id, 
    name: p.name, 
    totalBudget: p.totalBudget 
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">المشاريع</h1>
          <p className="text-sm text-white/40 mt-1">إدارة ومتابعة كافة مشاريع "كونترا"</p>
        </div>
        <div className="flex items-center gap-3">
          <AccountingExportButton 
            filename="تقرير_المشاريع" 
            text="تصدير البيانات" 
            sheets={[{ sheet: 'المشاريع', rows: exportRows }]} 
          />
        </div>
      </div>

      <div className="grid gap-8">
        {/* Add Project Section */}
        <ProjectsManager />

        {/* Projects Grid / Empty State */}
        {data.projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-6 rounded-[2.5rem] bg-[#1a1c1e] border border-white/10 text-center shadow-xl">
            <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-8 border border-emerald-500/20">
              <FiFolder className="w-10 h-10 text-emerald-400" />
            </div>
            
            <h3 className="text-3xl font-bold text-white mb-4 tracking-tight">لا توجد مشاريع مضافة بعد</h3>
            <p className="text-slate-300 max-w-sm mb-10 leading-relaxed text-base">
              ابدأ بإضافة أول مشروع لك لتتمكن من إدارة الميزانيات، الموظفين، والمصروفات بكل سهولة.
            </p>
            
            <div className="flex flex-wrap items-center justify-center gap-3">
              <span className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                إدارة الميزانية
              </span>
              <span className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                تتبع الموظفين
              </span>
              <span className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                مراقبة المصروفات
              </span>
            </div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { FiFolder } from 'react-icons/fi';
