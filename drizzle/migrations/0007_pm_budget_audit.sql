-- 0007_pm_budget_audit.sql: audit history for project manager budget changes
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS pm_budget_audit (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  project_manager_id TEXT NOT NULL REFERENCES project_managers(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  old_budget REAL,
  new_budget REAL NOT NULL,
  change_date DATE NOT NULL DEFAULT CURRENT_DATE,
  changed_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pm_budget_audit_pm ON pm_budget_audit(project_manager_id);
CREATE INDEX IF NOT EXISTS idx_pm_budget_audit_project ON pm_budget_audit(project_id);

-- Trigger function to log insert/update budget changes
CREATE OR REPLACE FUNCTION log_pm_budget_change() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO pm_budget_audit (project_manager_id, project_id, user_id, old_budget, new_budget)
    VALUES (NEW.id, NEW.project_id, NEW.user_id, NULL, NEW.budget);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' AND NEW.budget IS DISTINCT FROM OLD.budget THEN
    INSERT INTO pm_budget_audit (project_manager_id, project_id, user_id, old_budget, new_budget)
    VALUES (NEW.id, NEW.project_id, NEW.user_id, OLD.budget, NEW.budget);
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_pm_budget_audit ON project_managers;
CREATE TRIGGER trg_pm_budget_audit
  AFTER INSERT OR UPDATE ON project_managers
  FOR EACH ROW EXECUTE FUNCTION log_pm_budget_change();
