
import { NextRequest } from 'next/server';
import { db } from '@/drizzle/db';
import { toolMovements, tools, users } from '@/drizzle/schema';
import { desc, eq } from 'drizzle-orm';
import { apiSuccess, apiError } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ toolId: string }> }) {
  try {
    const { toolId } = await params;
    
    // We could join with projects table to get project names for fromLocation/toLocation if they are IDs
    // But since fromLocation/toLocation are text and could be 'Warehouse' or a project name/ID, 
    // we might need to handle that on client or join conditionally. 
    // For now, fetching the raw movement data + joined user name.
    
    const history = await db
      .select({
        id: toolMovements.id,
        fromLocation: toolMovements.fromLocation,
        toLocation: toolMovements.toLocation,
        movedAt: toolMovements.movedAt,
        responsiblePmName: users.username,
      })
      .from(toolMovements)
      .leftJoin(users, eq(toolMovements.responsiblePmId, users.id))
      .where(eq(toolMovements.toolId, toolId))
      .orderBy(desc(toolMovements.movedAt));

    return apiSuccess(req, { history });
  } catch (error: any) {
    return apiError(req, 'tool_history_failed', 'فشل جلب سجل الأداة', 500);
  }
}
