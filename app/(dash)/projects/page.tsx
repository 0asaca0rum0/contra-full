export const metadata = { title: 'المشاريع' };
import { getBaseUrl } from '@/lib/baseUrl';
import ProjectsManager from '@/components/projects/ProjectsManager';
import ProjectCard from '@/components/projects/ProjectCard';
import AccountingExportButton from '@/components/accounting/AccountingExportButton';

async function getProjects() {
  const base = await getBaseUrl();
  const url = `${base}/api/projects`;
  const res = await fetch(url, { cache: 'no-store' });
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">المشاريع</h1>
          <p className="text-sm text-slate-400 mt-1">إدارة وعرض جميع المشاريع</p>
        </div>
        <AccountingExportButton 
          filename="تقرير_المشاريع" 
          text="تصدير" 
          sheets={[{ sheet: 'المشاريع', rows: exportRows }]} 
        />
      </div>

      {/* Add Project Form */}
      <ProjectsManager initial={data.projects || []} />

      {/* Projects Grid */}
      {data.projects.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border border-dashed border-slate-700 bg-slate-900/50">
          <p className="text-slate-400">لا توجد مشاريع حالياً</p>
          <p className="text-sm text-slate-500 mt-1">أضف مشروعاً جديداً للبدء</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
