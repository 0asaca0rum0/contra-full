-- 0005_fix_cascades.sql
-- Force reapplication of ON DELETE CASCADE for project-related foreign keys.
-- This addresses persistent FK violations when deleting projects due to earlier
-- migrations not being applied on the current database instance.

-- Employees -> Projects
ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_project_id_projects_id_fk;
ALTER TABLE employees
  ADD CONSTRAINT employees_project_id_projects_id_fk
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE ON UPDATE NO ACTION;

-- Attendance -> Employees
ALTER TABLE attendance DROP CONSTRAINT IF EXISTS attendance_employee_id_employees_id_fk;
ALTER TABLE attendance
  ADD CONSTRAINT attendance_employee_id_employees_id_fk
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE ON UPDATE NO ACTION;

-- Project Managers -> Projects
ALTER TABLE project_managers DROP CONSTRAINT IF EXISTS project_managers_project_id_projects_id_fk;
ALTER TABLE project_managers
  ADD CONSTRAINT project_managers_project_id_projects_id_fk
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE ON UPDATE NO ACTION;

-- Project Managers -> Users
ALTER TABLE project_managers DROP CONSTRAINT IF EXISTS project_managers_user_id_users_id_fk;
ALTER TABLE project_managers
  ADD CONSTRAINT project_managers_user_id_users_id_fk
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE NO ACTION;

-- Warehouse Transactions -> Projects
ALTER TABLE warehouse_transactions DROP CONSTRAINT IF EXISTS warehouse_transactions_project_id_projects_id_fk;
ALTER TABLE warehouse_transactions
  ADD CONSTRAINT warehouse_transactions_project_id_projects_id_fk
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE ON UPDATE NO ACTION;

-- Transactions -> Projects
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_project_id_projects_id_fk;
ALTER TABLE transactions
  ADD CONSTRAINT transactions_project_id_projects_id_fk
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE ON UPDATE NO ACTION;

-- pm_budgets -> Projects (table may not exist yet; ignore failure)
DO $$ BEGIN
  PERFORM 1 FROM information_schema.tables WHERE table_name = 'pm_budgets';
  IF FOUND THEN
    ALTER TABLE pm_budgets DROP CONSTRAINT IF EXISTS pm_budgets_project_id_projects_id_fk;
    ALTER TABLE pm_budgets
      ADD CONSTRAINT pm_budgets_project_id_projects_id_fk
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE ON UPDATE NO ACTION;
  END IF;
END $$;

-- pm_budgets -> Users
DO $$ BEGIN
  PERFORM 1 FROM information_schema.tables WHERE table_name = 'pm_budgets';
  IF FOUND THEN
    ALTER TABLE pm_budgets DROP CONSTRAINT IF EXISTS pm_budgets_user_id_users_id_fk;
    ALTER TABLE pm_budgets
      ADD CONSTRAINT pm_budgets_user_id_users_id_fk
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE NO ACTION;
  END IF;
END $$;

-- Optional verification (manual):
-- SELECT conrelid::regclass AS table, conname, confdeltype
-- FROM pg_constraint
-- WHERE contype='f' AND conrelid IN (
--   'employees'::regclass, 'attendance'::regclass, 'project_managers'::regclass,
--   'warehouse_transactions'::regclass, 'transactions'::regclass, 'pm_budgets'::regclass
-- );
