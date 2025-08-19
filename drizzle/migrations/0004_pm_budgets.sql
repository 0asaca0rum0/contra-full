-- 0004_pm_budgets.sql: introduce pm_budgets table for per-PM allocations
CREATE TABLE IF NOT EXISTS pm_budgets (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount REAL NOT NULL,
  note TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Optional index for querying allocations per project quickly
CREATE INDEX IF NOT EXISTS idx_pm_budgets_project ON pm_budgets(project_id);
CREATE INDEX IF NOT EXISTS idx_pm_budgets_project_user ON pm_budgets(project_id, user_id);
