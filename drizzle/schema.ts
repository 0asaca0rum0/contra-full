import { pgTable, text, timestamp, integer, real, boolean, unique, primaryKey } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Enums
export const roleEnum = text('role').$type<'ADMIN'|'MOD'|'PM'>();

// Users
export const users = pgTable('users', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  role: roleEnum.default('PM').notNull(),
  permissions: text('permissions').array().notNull().default(sql`ARRAY[]::text[]`),
  createdAt: timestamp('created_at', { withTimezone: false }).defaultNow().notNull(),
});

// Projects
export const projects = pgTable('projects', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  name: text('name').notNull(),
  totalBudget: real('total_budget').notNull(),
  createdAt: timestamp('created_at', { withTimezone: false }).defaultNow().notNull(),
});

// Project Managers (junction project <-> PM user)
export const projectManagers = pgTable('project_managers', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  // Re-introduced budget column (existing in DB) for per-PM current allocation (no history)
  budget: real('budget').notNull().default(0),
}, (t: any) => ({
  uniq: unique().on(t.projectId, t.userId),
}));

// PM Budgets (allocations per PM per project; adjustments history)
export const pmBudgets = pgTable('pm_budgets', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  amount: real('amount').notNull(), // positive allocation (can also store negative for reduction)
  note: text('note'),
  createdAt: timestamp('created_at', { withTimezone: false }).defaultNow().notNull(),
});

// Employees
export const employees = pgTable('employees', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  name: text('name').notNull(),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: false }).defaultNow().notNull(),
});

// Attendance
export const attendance = pgTable('attendance', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  date: timestamp('date', { withTimezone: false }).defaultNow().notNull(),
  present: boolean('present').notNull(),
  employeeId: text('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
  markedById: text('marked_by_id').notNull().references(() => users.id),
}, (t: any) => ({
  uniq: unique().on(t.employeeId, t.date),
}));

// Warehouse Items
export const warehouseItems = pgTable('warehouse_items', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  name: text('name').notNull(),
  quantity: integer('quantity').notNull(),
  imageUrl: text('image_url'),
  createdAt: timestamp('created_at', { withTimezone: false }).defaultNow().notNull(),
});

// Warehouse Transactions
export const warehouseTransactions = pgTable('warehouse_transactions', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  itemId: text('item_id').notNull().references(() => warehouseItems.id),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id),
  quantity: integer('quantity').notNull(), // negative=checkout, positive=return
  createdAt: timestamp('created_at', { withTimezone: false }).defaultNow().notNull(),
});

// Tools (simple inventory separate from warehouse items)
export const tools = pgTable('tools', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  name: text('name').notNull(),
  location: text('location').notNull(),
  createdAt: timestamp('created_at', { withTimezone: false }).defaultNow().notNull(),
});

// Suppliers
export const suppliers = pgTable('suppliers', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  name: text('name').notNull(),
  balance: real('balance').notNull(), // positive=we owe, negative=they owe
  createdAt: timestamp('created_at', { withTimezone: false }).defaultNow().notNull(),
});

// Transactions
export const transactions = pgTable('transactions', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  amount: real('amount').notNull(),
  description: text('description').notNull(),
  receiptUrl: text('receipt_url'),
  createdAt: timestamp('created_at', { withTimezone: false }).defaultNow().notNull(),
  projectId: text('project_id').notNull().references(() => projects.id),
  userId: text('user_id').notNull().references(() => users.id),
  supplierId: text('supplier_id').references(() => suppliers.id),
});

// PM Budget Audit (history)
export const pmBudgetAudit = pgTable('pm_budget_audit', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  projectManagerId: text('project_manager_id').notNull().references(() => projectManagers.id, { onDelete: 'cascade' }),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  oldBudget: real('old_budget'),
  newBudget: real('new_budget').notNull(),
  changeDate: timestamp('changed_at', { withTimezone: false }).defaultNow().notNull(),
});
