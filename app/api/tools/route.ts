import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/drizzle/db';
import { tools, projects, projectManagers } from '@/drizzle/schema';
import { eq, ilike, and, sql } from 'drizzle-orm';

// GET /api/tools?search=hammer
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search');
  let rows;
  if (search) {
    rows = await db.select().from(tools).where(ilike(tools.name, `%${search}%`));
  } else {
    rows = await db.select().from(tools);
  }
  return NextResponse.json({ tools: rows });
}

// POST /api/tools { name, location: projectId, responsiblePmId }
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as any;
  const name = (body?.name || '').trim();
  const location = (body?.location || '').trim();
  const responsiblePmId = (body?.responsiblePmId || '').trim();
  if (!name || !location) return NextResponse.json({ error: 'name and location required' }, { status: 400 });
  if (!responsiblePmId) return NextResponse.json({ error: 'responsiblePmId required' }, { status: 400 });
  const projectExists = await db.select({ id: projects.id }).from(projects).where(eq(projects.id, location)).limit(1);
  if (projectExists.length === 0) return NextResponse.json({ error: 'project not found' }, { status: 404 });
  const pmAssignment = await db
    .select({ ok: sql`1` })
    .from(projectManagers)
    .where(and(eq(projectManagers.projectId, location), eq(projectManagers.userId, responsiblePmId)))
    .limit(1);
  if (pmAssignment.length === 0) {
    return NextResponse.json({ error: 'responsible PM must belong to the selected project' }, { status: 400 });
  }
  const [created] = await db.insert(tools).values({ name, location, responsiblePmId }).returning();
  return NextResponse.json({ tool: created }, { status: 201 });
}
