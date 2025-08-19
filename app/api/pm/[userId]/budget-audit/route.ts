import { NextRequest } from 'next/server';
import { db } from '@/drizzle/db';
import { pmBudgetAudit } from '@/drizzle/schema';
import { eq, desc } from 'drizzle-orm';
import { parseQueryInt, apiSuccess } from '@/lib/api';

// GET /api/pm/:userId/budget-audit?limit=20&offset=0
// Use permissive signature; extract dynamic param from request URL (Next.js injects). 
export async function GET(req: NextRequest) {
  // pathname like /api/pm/<userId>/budget-audit
  const segments = req.nextUrl.pathname.split('/');
  const userId = segments[segments.indexOf('pm') + 1];
  const limit = parseQueryInt(req, 'limit', 20, 100);
  const offset = parseQueryInt(req, 'offset', 0, 10_000);
  const rows = await db.select().from(pmBudgetAudit).where(eq(pmBudgetAudit.userId, userId)).orderBy(desc(pmBudgetAudit.changeDate as any)).limit(limit).offset(offset);
  return apiSuccess(req, { audit: rows, paging: { limit, offset, count: rows.length } });
}
