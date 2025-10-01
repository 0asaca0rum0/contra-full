import { NextRequest } from 'next/server';
import { db } from '@/drizzle/db';
import { projects, projectManagers, employees, transactions } from '@/drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';
import { apiSuccess, apiError, logger } from '@/lib/api';
import { loadAuthContext, hasRequired } from '@/lib/authz';
import { normalizeReceiptUrl } from '@/lib/receipts';

export async function GET(req: NextRequest, ctx: { params: Promise<{ userId: string; projectId: string }> }) {
  const auth = await loadAuthContext();
  if (!auth.userId) return apiError(req, 'unauthorized', 'غير مصرح', 401);

  const { userId, projectId } = await ctx.params;
  const isSelf = auth.userId === userId;
  const canAdmin = hasRequired(auth.permissions, { anyOf: ['ALL', 'PROJECTS_READ'] });
  if (!isSelf && !canAdmin) {
    return apiError(req, 'forbidden', 'ممنوع', 403);
  }

  try {
    const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
    if (!project) return apiError(req, 'not_found', 'المشروع غير موجود', 404);

    const [assignment] = await db
      .select({
        id: projectManagers.id,
        budget: projectManagers.budget,
      })
      .from(projectManagers)
      .where(and(eq(projectManagers.projectId, projectId), eq(projectManagers.userId, userId)))
      .limit(1);

    if (!assignment && !canAdmin) {
      return apiError(req, 'not_assigned', 'مدير المشروع غير مرتبط بهذا المشروع', 404);
    }

    const workers = await db
      .select({ id: employees.id, name: employees.name, createdAt: employees.createdAt })
      .from(employees)
      .where(eq(employees.projectId, projectId))
      .orderBy(desc(employees.createdAt));

    const txRows = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.projectId, projectId), eq(transactions.userId, userId)))
      .orderBy(desc(transactions.createdAt));

    const transactionsForPm = txRows.map((row) => ({
      ...row,
      receiptUrl: normalizeReceiptUrl(row.receiptUrl),
    }));

    const spent = transactionsForPm.reduce((sum, row) => sum + Number(row.amount || 0), 0);
    const allocated = Number(assignment?.budget ?? 0);
    const remaining = allocated - spent;
    const receipts = transactionsForPm
      .map((row) => row.receiptUrl)
      .filter((url): url is string => Boolean(url));

    return apiSuccess(req, {
      project: {
        id: project.id,
        name: project.name,
        totalBudget: project.totalBudget,
      },
      pmBudget: {
        allocated,
        spent,
        remaining,
      },
      workers,
      transactions: transactionsForPm,
      receipts,
    });
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : String(error), projectId, userId }, 'pm_project_detail_failed');
    return apiError(req, 'server_error', 'حدث خطأ غير متوقع', 500);
  }
}
