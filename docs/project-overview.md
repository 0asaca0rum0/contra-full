# Contra Project Overview

_Last updated: September 30, 2025_

## 1. Mission & Value Proposition

Contra is an internal operations platform built for construction and contracting companies that need tight oversight of **projects**, **budgets**, **procurement**, and **field activity**. The web application centralizes:

- project planning and budget allocation for project managers (PMs),
- expense capture with receipt validation,
- supplier management and balance tracking,
- warehouse inventory control, tool tracking, and stock movements,
- workforce attendance logging and reporting,
- administrative control over users, permissions, and audits.

By consolidating these workflows, Contra gives leadership a real-time snapshot of spending vs allocation, ensures compliance on the ground, and surfaces exceptions early enough to act.

## 2. Core Features

| Domain | Capabilities |
|--------|--------------|
| **Projects & Budgets** | Create projects, allocate budgets per PM, enforce spent-vs-budget guardrails, audit allocation changes. |
| **Transactions & Receipts** | PMs submit expenses with attached receipts, normalized storage, and supplier attribution. |
| **Suppliers** | Maintain supplier directory, track outstanding balances, view spend history and recent transactions. |
| **Warehouse & Tools** | Manage inventory, log check-in/out movements, support supplier links, generate upload plans for item imagery. |
| **Attendance & Workforce** | Register employees per project, mark daily attendance, analyze trends per day or employee. |
| **Reporting & Analytics** | Budget, attendance, and warehouse reports with filters; cross-project dashboards for admins. |
| **User & Permission Management** | Admin CRUD for users, fine-grained permission overrides, role defaults, and secure deletion guardrails. |
| **Authentication Middleware** | Session-cookie login, protected routes, and redirect handling for the entire dashboard. |

## 3. User Roles & Journeys

### Project Manager (PM)
- Receives budgets per assigned project.
- Records expenses, uploads receipts, tracks remaining balance.
- Marks attendance for assigned crews and monitors supplier relationships.
- Observes warehouse inventory needed on-site.

### Moderator (MOD)
- Acts as an extended admin: reads project data, warehouse stock, attendance logs.
- May adjust budgets if granted `BUDGET_ADJUST` permission.

### Administrator (ADMIN)
- Full platform control (`ALL` permission).
- Manages users, assigns roles, resets permissions.
- Oversees cross-project dashboards, approves budget changes, and orchestrates warehouse or supplier operations.

## 4. Architecture at a Glance

```
Next.js 15 (App Router, React 19)
├─ UI components (Tailwind utilities, custom SectionCard, etc.)
├─ Route handlers under /app/api/*
│  ├─ Auth, Users, Projects, PM tooling
│  ├─ Suppliers, Transactions, Warehouse, Reports
│  └─ Utilities (receipts presign, file serving, uploads)
├─ Drizzle ORM ➜ PostgreSQL (schema in drizzle/schema.ts)
├─ Local storage emulating S3 (lib/s3.ts, uploads/ directory)
└─ Shared libs (lib/api.ts, lib/authz.ts, lib/permissions.ts, lib/receipts.ts)
```

- **Frontend**: Server Components + Client Components for interactive dashboards, using Tailwind-style utility classes and framer-motion for animation flourishes.
- **Backend**: Next.js route handlers driven by Drizzle queries; permissions enforced server-side via `loadAuthContext` middleware.
- **Storage**: Local filesystem `uploads/` folder mimics S3 object storage with presigned endpoints (`/api/files/upload`). Receipts and warehouse images are stored and retrieved via `lib/s3.ts` helpers.

## 5. Data Model Summary

Key tables defined in `drizzle/schema.ts`:

- `users`: accounts with role, hashed password, and explicit permissions array.
- `projects`: high-level project metadata and total budget.
- `project_managers`: junction between projects and PMs with a live `budget` column.
- `pm_budget_audit`: historical adjustments to allocations.
- `employees` & `attendance`: workforce membership and daily presence records.
- `transactions`: PM expenses referencing projects, suppliers, and receipts.
- `suppliers`: supplier master data plus running balance.
- `warehouse_items` & `warehouse_transactions`: inventory catalogue and movement history.
- `tools`: secondary inventory for shared equipment.

## 6. API Surface

See [`docs/api-overview.md`](./api-overview.md) for a detailed endpoint catalog. Highlights include:

- `POST /api/transactions` and `POST /api/projects/:projectId/expenses`: expense capture.
- `GET /api/pm/:userId/overview`: PM project portfolio metrics.
- `POST /api/warehouse/transactions`: stock movement with supplier balance adjustments.
- `GET /api/reports/budgets`, `GET /api/reports/attendance`, `GET /api/reports/warehouse`: analytics endpoints.
- Admin controls under `/api/admin/users/*` for user management and permission setting.

## 7. Security & Permissions

- Login sets an httpOnly `uid` cookie scoped to one week.
- `middleware.ts` blocks unauthenticated access to dashboard routes and most APIs.
- `lib/authz.ts` associates URL patterns with required permissions, evaluating `ALL`, `anyOf`, and `allOf` rules.
- Data-changing endpoints validate roles: e.g., `POST /api/projects/:projectId/pm-budgets` requires `BUDGET_ADJUST`, warehouse transactions guard against insufficient stock, and destructive actions (delete user/project) perform dependency checks.

## 8. Frontend Highlights

- Dashboards use `SectionCard` components to present metrics, tables, and call-to-actions.
- Internationalization: Arabic labels with Western numerals; responsive layouts for desktop first.
- Recent improvements include a refreshed navbar, unified supplier workspace with toggled modes, and PM guidance copy to direct user management tasks.

## 9. Mobile Companion Vision

A dedicated mobile experience is planned for PMs and admins to operate on-site. See [`docs/mobile-app-interfaces.md`](./mobile-app-interfaces.md) for navigation maps, flows, and integration notes.

## 10. Roadmap & Open Tasks

- Replace placeholder auth endpoints (`signup`, `refresh`) with production-ready flows and tokens suitable for mobile clients.
- Add warehouse imagery to the dashboard and history views.
- Expand automated tests and adopt lint/test pipelines.
- Generate OpenAPI specs from route handlers to keep docs synchronized.
- Harden authorization on endpoints currently relying on frontend discipline.

## 11. Getting Started

1. Copy `.env.example` to `.env` and configure database credentials plus `LOCAL_UPLOAD_DIR` if needed.
2. Run migrations: `npm run db:push` (or `db:migrate` after generating).
3. Start dev server: `npm run dev` (Turbopack enabled by default).
4. Access dashboard at `http://localhost:3000`. Use `/login` with seeded credentials (see `scripts/seed.ts`).

Contra continues to evolve toward a fully integrated operations suite. Contributions should maintain the documented permission model, preserve Arabic localization, and keep the API responses consistent with the patterns described above.
