-- 0006_drop_legacy_pm_budget.sql
-- Make legacy project_managers.budget nullable then drop it if it still exists.
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='project_managers' AND column_name='budget'
  ) THEN
    -- Remove NOT NULL first (if any)
    BEGIN
      ALTER TABLE project_managers ALTER COLUMN budget DROP NOT NULL;
    EXCEPTION WHEN undefined_column THEN
      -- ignore
      NULL;
    END;
    -- Drop column
    ALTER TABLE project_managers DROP COLUMN IF EXISTS budget;
  END IF;
END $$;
