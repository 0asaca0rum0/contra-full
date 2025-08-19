import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../drizzle/db';
import { sql } from 'drizzle-orm';

// GET /api/pm/projects (PM)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId'); // since no JWT
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });
  const rows = await db.execute(sql`
    SELECT p.* , pm.budget
    FROM project_managers pm
    JOIN projects p ON p.id = pm.project_id
    WHERE pm.user_id = ${userId}
  `);
  return NextResponse.json({ projects: (rows as any).rows ?? [] });
}
