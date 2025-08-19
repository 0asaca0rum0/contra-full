export const metadata = { title: 'المشاريع' };
import { getBaseUrl } from '@/lib/baseUrl';

async function getProjects() {
  const base = await getBaseUrl();
  const url = `${base}/api/projects`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch projects: ${res.status}`);
  return res.json();
}

import ProjectsManager from '@/components/projects/ProjectsManager';
import { Suspense } from 'react';
import Link from 'next/link';
import AccountingExportButton from '@/components/accounting/AccountingExportButton';

export default async function Page() {
  let data: any = { projects: [] };
  try {
    data = await getProjects();
  } catch (e) {}
  const exportRows = (data.projects || []).map((p: any)=>({ id: p.id, name: p.name, totalBudget: p.totalBudget }));
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl section-title">المشاريع</h1>
        <AccountingExportButton filename="تقرير_المشاريع" text="تصدير" sheets={[{ sheet: 'المشاريع', rows: exportRows }]} />
      </div>
      <ProjectsManager initial={data.projects || []} />
      <ul className="grid sm:grid-cols-2 gap-3">
        {(data.projects || []).map((p: any) => (
          <li key={p.id}>
            <Link href={`/projects/${p.id}`} className="group block rounded-[16px] border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-xl p-5 hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]">
              <div className="font-semibold mb-1 text-[1.05em] flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 group-hover:scale-125 transition-transform" />
                {p.name}
              </div>
              <div className="text-xs text-[var(--color-text-secondary)]"># {p.id.slice(0,8)}</div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
