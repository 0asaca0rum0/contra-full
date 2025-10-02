import { NextRequest } from 'next/server';
import { apiSuccess, apiError, logger } from '@/lib/api';
import { loadAuthContext, hasRequired } from '@/lib/authz';
import { loadPmProjectDetail } from '@/lib/pm-project-detail';

export async function GET(req: NextRequest, ctx: { params: Promise<{ projectId: string }> }) {
  const auth = await loadAuthContext();
  if (!auth.userId) return apiError(req, 'unauthorized', 'غير مصرح', 401);

  const { projectId } = await ctx.params;
  const url = new URL(req.url);
  const queryUserId = url.searchParams.get('userId') || url.searchParams.get('pmId') || auth.userId;
  const userId = queryUserId.trim();

  const isSelf = auth.userId === userId;
  const canAdmin = hasRequired(auth.permissions, { anyOf: ['ALL', 'PROJECTS_READ'] });
  if (!isSelf && !canAdmin) {
    return apiError(req, 'forbidden', 'ممنوع', 403);
  }

  try {
    const detail = await loadPmProjectDetail(userId, projectId);
    if (!detail) return apiError(req, 'not_found', 'المشروع غير موجود', 404);

    if (!detail.assignment && !canAdmin) {
      return apiError(req, 'not_assigned', 'مدير المشروع غير مرتبط بهذا المشروع', 404);
    }

    return apiSuccess(req, {
      project: {
        id: detail.project.id,
        name: detail.project.name,
        totalBudget: detail.project.totalBudget,
      },
      pmBudget: detail.pmBudget,
      workers: detail.workers,
      transactions: detail.transactions,
      receipts: detail.receipts,
    });
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : String(error), projectId, userId },
      'pm_project_detail_legacy_failed'
    );
    return apiError(req, 'server_error', 'حدث خطأ غير متوقع', 500);
  }
}
