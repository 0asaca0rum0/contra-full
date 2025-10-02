import { db } from '@/drizzle/db';
import { projects, projectManagers, employees, transactions } from '@/drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';
import { normalizeReceiptUrl } from '@/lib/receipts';

export type PmProjectDetailResult = {
  project: {
    id: string;
    name: string;
    totalBudget: number;
    createdAt: Date;
  };
  assignment: {
    id: string;
    budget: number;
  } | null;
  workers: Array<{
    id: string;
    name: string;
    createdAt: Date;
  }>;
  transactions: Array<ReturnType<typeof mapTransactionRow>>;
  pmBudget: {
    allocated: number;
    spent: number;
    remaining: number;
  };
  receipts: string[];
};

type TransactionRow = typeof transactions.$inferSelect;

function mapTransactionRow(row: TransactionRow) {
  return {
    ...row,
    receiptUrl: normalizeReceiptUrl(row.receiptUrl),
  };
}

export async function loadPmProjectDetail(userId: string, projectId: string): Promise<PmProjectDetailResult | null> {
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!project) return null;

  const [assignment] = await db
    .select({ id: projectManagers.id, budget: projectManagers.budget })
    .from(projectManagers)
    .where(and(eq(projectManagers.projectId, projectId), eq(projectManagers.userId, userId)))
    .limit(1);

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

  const transactionsForPm = txRows.map(mapTransactionRow);
  const spent = transactionsForPm.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const allocated = Number(assignment?.budget ?? 0);
  const remaining = allocated - spent;
  const receipts = transactionsForPm
    .map((row) => row.receiptUrl)
    .filter((url): url is string => Boolean(url));

  return {
    project: {
      id: project.id,
      name: project.name,
      totalBudget: Number(project.totalBudget),
      createdAt: project.createdAt,
    },
    assignment: assignment ? { id: assignment.id, budget: Number(assignment.budget ?? 0) } : null,
    workers,
    transactions: transactionsForPm,
    pmBudget: {
      allocated,
      spent,
      remaining,
    },
    receipts,
  };
}
