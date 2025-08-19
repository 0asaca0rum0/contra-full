-- Add ON DELETE CASCADE to safe relations

-- project_managers.project_id -> projects.id
ALTER TABLE "project_managers" DROP CONSTRAINT IF EXISTS "project_managers_project_id_projects_id_fk";
ALTER TABLE "project_managers" ADD CONSTRAINT "project_managers_project_id_projects_id_fk"
  FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- project_managers.user_id -> users.id
ALTER TABLE "project_managers" DROP CONSTRAINT IF EXISTS "project_managers_user_id_users_id_fk";
ALTER TABLE "project_managers" ADD CONSTRAINT "project_managers_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- employees.project_id -> projects.id
ALTER TABLE "employees" DROP CONSTRAINT IF EXISTS "employees_project_id_projects_id_fk";
ALTER TABLE "employees" ADD CONSTRAINT "employees_project_id_projects_id_fk"
  FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- attendance.employee_id -> employees.id
ALTER TABLE "attendance" DROP CONSTRAINT IF EXISTS "attendance_employee_id_employees_id_fk";
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_employee_id_employees_id_fk"
  FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- warehouse_transactions.project_id -> projects.id (cascade to clean project deletes)
ALTER TABLE "warehouse_transactions" DROP CONSTRAINT IF EXISTS "warehouse_transactions_project_id_projects_id_fk";
ALTER TABLE "warehouse_transactions" ADD CONSTRAINT "warehouse_transactions_project_id_projects_id_fk"
  FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
