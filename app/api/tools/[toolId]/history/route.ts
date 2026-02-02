
import { NextRequest } from 'next/server';
import { db } from '@/drizzle/db';
import { toolMovements, tools, users, projects } from '@/drizzle/schema';
import { desc, eq, inArray } from 'drizzle-orm';
import { apiSuccess, apiError } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ toolId: string }> }) {
  try {
    const { toolId } = await params;

    // First, get the movement history with user names
    const movements = await db
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

    // Collect all unique location IDs
    const locationIds = new Set<string>();
    movements.forEach(m => {
      if (m.fromLocation) locationIds.add(m.fromLocation);
      if (m.toLocation) locationIds.add(m.toLocation);
    });

    // Fetch project names for these locations
    const projectMap = new Map<string, string>();
    if (locationIds.size > 0) {
      const projectsData = await db
        .select({ id: projects.id, name: projects.name })
        .from(projects)
        .where(inArray(projects.id, Array.from(locationIds)));

      projectsData.forEach(p => projectMap.set(p.id, p.name));
    }

    // Map the results to include both IDs and names
    const history = movements.map(item => ({
      id: item.id,
      fromLocationId: item.fromLocation || null,
      fromLocationName: projectMap.get(item.fromLocation || '') || null,
      toLocationId: item.toLocation || null,
      toLocationName: projectMap.get(item.toLocation || '') || null,
      movedAt: item.movedAt,
      responsiblePmName: item.responsiblePmName,
    }));

    return apiSuccess(req, { history });
  } catch (error: any) {
    return apiError(req, 'tool_history_failed', 'فشل جلب سجل الأداة', 500);
  }
}
