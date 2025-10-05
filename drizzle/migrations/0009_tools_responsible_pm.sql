-- 0009_tools_responsible_pm.sql: add responsible PM to tools
ALTER TABLE tools
  ADD COLUMN IF NOT EXISTS responsible_pm_id TEXT REFERENCES users(id);

CREATE INDEX IF NOT EXISTS idx_tools_responsible_pm ON tools(responsible_pm_id);
