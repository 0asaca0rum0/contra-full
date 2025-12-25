import { getBaseUrl } from '@/lib/baseUrl';
import ProjectsManager from '@/components/projects/ProjectsManager';
import ProjectCard from '@/components/projects/ProjectCard';
import AccountingExportButton from '@/components/accounting/AccountingExportButton';
import { cookies } from 'next/headers';
import { FiFolder } from 'react-icons/fi';

export const metadata = { title: 'المشاريع' };

async function getProjects() {
  const base = await getBaseUrl();
  const ck = await cookies();
  const cookieHeader = ck.toString();
  
  const url = `${base}/api/projects`;

  try {
    const res = await fetch(url, { 
      cache: 'no-store',
      headers: {
        ...(cookieHeader ? { cookie: cookieHeader } : {})
      }
    });

    if (!res.ok) return { projects: [] };

    return await res.json();
  } catch (err) {
    return { projects: [] };
  }
}

export default async function Page() {
  const data = await getProjects();
  const projects = data?.projects || [];

  const exportRows = projects.map((p: any) => ({ 
    id: p.id, 
    name: p.name, 
    totalBudget: p.totalBudget 
  }));

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">المشاريع</h1>
          <p className="text-sm font-bold text-emerald-600 uppercase tracking-widest mt-1">إدارة ومتابعة كافة مشاريع "كونترا"</p>
        </div>
        <div className="flex items-center gap-4">
          <AccountingExportButton 
            filename="تقرير_المشاريع" 
            text="تصدير البيانات" 
            sheets={[{ sheet: 'المشاريع', rows: exportRows }]} 
          />
        </div>
      </div>

      <div className="grid gap-10">
        {/* Add Project Section */}
        <section className="relative z-20">
          <ProjectsManager />
        </section>

        {/* Projects Grid / Empty State */}
        <section className="relative z-10">
          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 px-6 rounded-[2.5rem] bg-white border border-slate-200 text-center shadow-lg">
              <div className="w-20 h-20 rounded-3xl bg-emerald-50 flex items-center justify-center mb-8 border border-emerald-100 shadow-sm">
                <FiFolder className="w-10 h-10 text-emerald-600" />
              </div>
              
              <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">لا توجد مشاريع مضافة بعد</h3>
              <p className="text-slate-500 max-w-sm mb-10 leading-relaxed text-base font-medium">
                ابدأ بإضافة أول مشروع لك لتتمكن من إدارة الميزانيات، الموظفين، والمصروفات بكل سهولة.
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project: any) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
