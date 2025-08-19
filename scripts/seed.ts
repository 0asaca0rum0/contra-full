import 'dotenv/config';
import { db, pool } from '../drizzle/db';
import { users, projects, projectManagers, employees, suppliers, warehouseItems } from '../drizzle/schema';
import { sql, eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { resolveDefaultPermissions } from '../lib/permissions';

async function ensurePgcrypto() {
  await db.execute(sql`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);
}

async function upsertUser(username: string, password: string, role: 'ADMIN'|'MOD'|'PM', permissions?: string[]) {
  const hash = await bcrypt.hash(password, 10);
  const existing = await db.select().from(users).where(eq(users.username, username));
  if (existing.length) return existing[0];
  const perms = resolveDefaultPermissions(role, permissions);
  const [inserted] = await db.insert(users).values({ username, password: hash, role, permissions: perms }).returning();
  return inserted;
}

async function upsertProject(name: string, totalBudget: number) {
  const existing = await db.select().from(projects).where(eq(projects.name, name));
  if (existing.length) return existing[0];
  const [inserted] = await db.insert(projects).values({ name, totalBudget }).returning();
  return inserted;
}

async function upsertSupplier(name: string, balance: number) {
  const existing = await db.select().from(suppliers).where(eq(suppliers.name, name));
  if (existing.length) return existing[0];
  const [inserted] = await db.insert(suppliers).values({ name, balance }).returning();
  return inserted;
}

async function upsertItem(name: string, quantity: number) {
  const existing = await db.select().from(warehouseItems).where(eq(warehouseItems.name, name));
  if (existing.length) return existing[0];
  const [inserted] = await db.insert(warehouseItems).values({ name, quantity }).returning();
  return inserted;
}

async function run() {
  try {
    await ensurePgcrypto();

  const admin = await upsertUser('admin', 'admin123', 'ADMIN');
  const mod = await upsertUser('moderator', 'mod123', 'MOD');
  const pm = await upsertUser('pm', 'pm123', 'PM');

    const projectA = await upsertProject('Project A', 100000);
    const projectB = await upsertProject('Project B', 50000);

    // Ensure PM is linked to Project A with budget
    const pmLink = await db.execute(sql`
      INSERT INTO project_managers (project_id, user_id, budget)
      VALUES (${projectA.id}, ${pm.id}, ${25000})
      ON CONFLICT (project_id, user_id) DO UPDATE SET budget = EXCLUDED.budget
      RETURNING *;
    `);

    // Seed a couple of employees for Project A
    const existingEmps = await db.execute(sql`SELECT id FROM employees WHERE project_id = ${projectA.id} LIMIT 1;`);
    if ((existingEmps as any).rowCount === 0) {
      await db.insert(employees).values([
        { name: 'Alice', projectId: projectA.id },
        { name: 'Bob', projectId: projectA.id },
      ]);
    }

    await upsertSupplier('Acme Supplies', 0);
    await upsertSupplier('Global Vendor', 1000);

    await upsertItem('Cement Bags', 200);
    await upsertItem('Steel Rods', 120);

    console.log('Seed complete:', {
      admin: admin.username,
      pm: pm.username,
      projects: [projectA.name, projectB.name],
    });
  } finally {
    await pool.end();
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
