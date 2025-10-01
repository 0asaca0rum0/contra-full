# Contra API Reference

_Last updated: September 30, 2025_

## 1. Overview

Contra's backend is implemented with **Next.js route handlers** (App Router) and **TypeScript**. Data persistence relies on **PostgreSQL** accessed via **Drizzle ORM**. Authentication is session-cookie based (`uid` cookie), and authorization is driven by role-specific permission flags. Responses adopt a consistent JSON envelope (`success`, `requestId`, `data|error`), and validation is handled with **Zod** where implemented.

```
Next.js 15 ➜ `/app/api/*` route handlers
⬑ Drizzle ORM ➜ PostgreSQL (`drizzle/schema.ts`)
⬑ Local file storage ➜ `lib/s3.ts` (emulates S3-style flows)
```

### Core Libraries & Utilities

- `lib/api.ts`: helpers for response envelopes, error handling, pagination parsing, and structured logging.
- `lib/authz.ts`: loads the current user context from cookies, maps route → required permissions, and evaluates permission checks.
- `lib/receipts.ts`: normalizes stored receipt keys into public URLs for download.
- `middleware.ts`: enforces authentication across routes (redirects unauthenticated traffic to `/login`, blocks API calls lacking the `uid` cookie, and whitelists static or public resources).

### Authentication & Authorization Model

1. **Login flow** (`POST /api/auth/login`): verifies credentials using `bcrypt`, then sets the session cookie `uid`.
2. **Session discovery** (`GET /api/auth/me`): looks up the user by `uid` cookie and returns identity, role, and explicit permissions.
3. **Logout** (`POST /api/auth/logout`): clears auth cookies and redirects to `/login`.
4. **Role & permission evaluation**: `loadAuthContext()` fetches the user row; `hasRequired()` checks for `ALL`, `anyOf`, or `allOf` rules; `routePermsForPath()` exposes default permission requirements per URL pattern.

> **Note:** Some endpoints (e.g., `/api/auth/signup`, `/api/auth/refresh`, `/api/admin/project-managers/:pmId/budget`, `/api/projects/:projectId/managers/:pmId/budget`, `/api/upload`) are scaffolding stubs awaiting full implementations.

### Response Shape & Errors

- Success: `{ "success": true, "requestId": "uuid", "data": { ... } }`
- Error: `{ "success": false, "requestId": "uuid", "error": { "code", "message", "details"? } }`
- Validation errors produced via Zod emit `error.code = "validation_error"` with `details.fieldErrors`.
- Pagination helpers (`parseQueryInt`) clamp `limit`/`offset` to safe ranges.

### File Storage & Receipts

- `POST /api/receipts/presign`: plans a local upload path, returning `{ key, uploadUrl, formField, publicUrl }`.
- `POST /api/files/upload?key=...`: accepts `multipart/form-data` in Node.js runtime, enforces type (`png`, `jpeg`, `pdf`) and size (≤10 MB).
- `GET /api/files/[...key]`: streams stored files with best-effort content-type detection.
- `lib/receipts` ensures stored keys are normalized and public URLs remain under `/api/files/`.

## 2. Domain Modules & Endpoints

The tables below list primary endpoints, expected permissions, and notable behaviors. Unless otherwise noted, requests require authentication and respect authorization guards defined in `lib/authz.ts`.

### 2.1 Authentication

| Method & Path | Purpose | Notes |
|---------------|---------|-------|
| `POST /api/auth/login` | Exchange username/password for a `uid` session cookie. | Responds with user metadata; invalid credentials → 401.
| `GET /api/auth/me` | Resolve current user from cookie. | Returns `{ user: null }` if unauthenticated.
| `POST /api/auth/logout` | Clears auth cookies and redirects to `/login`. | Currently redirects using 302.
| `POST /api/auth/signup` | _Stub_. Planned admin-only user provisioning endpoint. |
| `POST /api/auth/refresh` | _Stub_. Reserved for token refresh logic. |

### 2.2 User & Permission Management (Admin scope)

| Method & Path | Purpose | Permissions |
|---------------|---------|-------------|
| `GET /api/admin/users` | List all users (id, username, role, permissions, createdAt). | `ALL` or `USERS_READ` (middleware currently relies on route-level enforcement).
| `POST /api/admin/users` | Create user with role, password, optional explicit permissions. | Admin; defaults resolved via `resolveDefaultPermissions`.
| `PUT /api/admin/users/:userId` | Update username, password, role, or explicit permissions. | Admin.
| `DELETE /api/admin/users/:userId` | Delete user if no dependent activity records exist. | Admin; returns 409 if attendance/transactions present.
| `GET /api/admin/users/:userId/permissions` | Inspect a user's effective permissions and defaults. | `ALL` or `USERS_READ`.
| `PUT /api/admin/users/:userId/permissions` | Reset or set explicit permissions with validation. | `ALL` only; rejects unknown keys, supports role-sync.

### 2.3 Projects & Allocations

| Method & Path | Purpose | Notes |
|---------------|---------|-------|
| `GET /api/projects` | List projects, optional name search. | No auth gating in handler yet; expect upstream guard.
| `POST /api/projects` | Create project with name & optional `totalBudget`. | Admin/authorized moderator.
| `GET /api/projects/:projectId` | Fetch project details. |
| `PATCH /api/projects/:projectId` | Update name or total budget. |
| `DELETE /api/projects/:projectId` | Delete project; supports `force=1` for manual cascade. | Performs transactional cleanup of employees, allocations, attendance, transactions, warehouse data, and legacy `pm_budgets` when present.
| `GET /api/projects/:projectId/members` | View PMs, employees, implicit admins on project. |
| `POST /api/projects/:projectId/members` | Add PM (handles legacy budget column). |
| `DELETE /api/projects/:projectId/members?userId=` | Remove PM from project. |
| `GET /api/projects/:projectId/budgets` | List PM allocation records (raw). |
| `POST /api/projects/:projectId/budgets` | Ensure PM allocation row exists (budget defaults handled elsewhere). |
| `GET /api/projects/:projectId/pm-budgets` | Authorized summary of PM budgets, spending, and audit history. | Creates audit infrastructure on-demand and returns diagnostics if history empty.
| `POST /api/projects/:projectId/pm-budgets` | Adjust PM allocation (`delta`, `userId`); logs into `pm_budget_audit`. | Enforces non-negative final budgets and `BUDGET_ADJUST` permission.
| `GET /api/projects/:projectId/budget` | Aggregate allocated vs spent amounts for project. |
| `GET /api/projects/:projectId/expenses` | List expenses with optional date range filtering; normalizes receipt URLs. |
| `POST /api/projects/:projectId/expenses` | Create expense against a PM allocation with receipt support. | Checks allocation remainder to prevent overspend.
| `GET /api/projects/:projectId/attendance` | Daily attendance snapshot for project. |

### 2.4 Project Manager (PM) Utilities

| Method & Path | Purpose | Notes |
|---------------|---------|-------|
| `GET /api/pm/overview` | Portfolio-wide view of PM allocations vs spending (includes admins). |
| `GET /api/pm/projects?userId=` | Projects assigned to specific PM (includes current budget). |
| `GET /api/pm/:userId/overview` | Deep dive per project (budgets, spend, recent expenses, audit history). |
| `GET /api/pm/:userId/budget-audit` | Paginated audit log of allocation adjustments. |
| `GET /api/pm/attendance/today?userId=` | Attendance entries today for PM's projects. |

### 2.5 Transactions & Receipts

| Method & Path | Purpose | Notes |
|---------------|---------|-------|
| `GET /api/transactions` | List transactions (filter by `userId`, `projectId`, `limit`, `offset`). | PM view is implicitly limited by permission logic.
| `POST /api/transactions` | Create PM expense. | Accepts optional `receiptKey` to attach stored asset.
| `DELETE /api/transactions/:transactionId` | Remove transaction and delete local receipt file if present. |
| `POST /api/transactions/:transactionId/receipt` | Attach/replace receipt for existing transaction. | Normalizes stored key via `normalizeReceiptStorage`.

### 2.6 Suppliers

| Method & Path | Purpose | Notes |
|---------------|---------|-------|
| `GET /api/suppliers` | List suppliers (search by name). |
| `POST /api/suppliers` | Create supplier with initial balance. |
| `PUT /api/suppliers/:supplierId` | Update supplier name or balance. |
| `DELETE /api/suppliers/:supplierId` | Remove supplier. |
| `PATCH /api/suppliers/:supplierId/balance` | Increment/decrement supplier balance (atomic SQL). |
| `GET /api/suppliers/overview` | Aggregated stats (spent, transaction count, last activity). |
| `GET /api/suppliers/:supplierId/overview` | Supplier profile with spend history and latest transactions. |

### 2.7 Warehouse & Tools

| Method & Path | Purpose | Notes |
|---------------|---------|-------|
| `GET /api/warehouse/items` | List warehouse items (search supported). |
| `POST /api/warehouse/items` | Create item with starting quantity & optional image URL. |
| `PUT /api/warehouse/items/:itemId` | Update name/quantity/image URL. |
| `GET /api/warehouse/items/:itemId/history` | Fetch warehouse movement history for item. |
| `POST /api/warehouse/items/presign` | Generate upload plan for item imagery. |
| `POST /api/warehouse/transactions` | Record stock movement (IN/OUT), update inventory, optionally adjust supplier balance. | Validates stock availability and caps quantities.
| `GET /api/tools` | List or search tools. |
| `POST /api/tools` | Create tool record. |
| `PATCH /api/tools/:toolId` | Update tool name or location with validation (Arabic messaging). |

### 2.8 Attendance & Employees

| Method & Path | Purpose | Notes |
|---------------|---------|-------|
| `POST /api/attendance` | Mark attendance; ensures per-day uniqueness and ties mark to authenticated user. |
| `GET /api/attendance` | Fetch attendance by day and optional project. |
| `POST /api/employees` | Create employee linked to project. |
| `GET /api/employees` | List employees, optional `projectId` filter. |
| `PATCH /api/employees?id=` | Rename employee. |
| `DELETE /api/employees?id=` | Remove employee. |

### 2.9 Reporting

| Method & Path | Purpose |
|---------------|---------|
| `GET /api/reports/budgets` | Project-level and per-PM budget vs spending summary (optional project filter).
| `GET /api/reports/attendance` | Attendance analytics grouped by day or employee over a date range.
| `GET /api/reports/warehouse` | Stock levels and movement trends for warehouse items within a window.

### 2.10 Admin Project Stubs

| Method & Path | Status |
|---------------|--------|
| `GET /api/admin/projects` | Returns `{ adminProjects: [], message: 'stub' }` to satisfy build.
| `POST /api/admin/projects` | Echoes payload; intended for future admin project provisioning.
| `POST /api/admin/project-managers/:pmId/budget` | Placeholder for dedicated admin allocation flow.
| `PATCH /api/projects/:projectId/managers/:pmId/budget` | Placeholder for project-level budget adjustment.
| `POST /api/upload` | Placeholder for generic upload (receipts use `/api/files/upload`).

## 3. Data Model Summary

Schema definitions live in `drizzle/schema.ts`. Key tables include:

- `users`: credentials, role, explicit permissions list (array of text).
- `projects`: project metadata and total budget.
- `project_managers`: junction table with per-PM budget column.
- `pm_budgets`: historical log of allocation events (audit table).
- `employees`: workforce records tied to projects.
- `attendance`: per-employee daily attendance status.
- `suppliers`: supplier master data and running balance.
- `transactions`: financial transactions (expenses) with optional supplier and receipt.
- `warehouse_items`, `warehouse_transactions`: inventory plus movement log.
- `tools`: lightweight asset tracking for tools/equipment.

## 4. Cross-Cutting Concerns

### Internationalization & Localization

- Arabic copy is preserved across responses where user-facing messages are returned (e.g., validation messages in `tools`, errors in `warehouse/transactions`).
- Numeric formatting for UI consumers uses Western Arabic numerals (`Intl.NumberFormat`) on the frontend; API returns raw numbers.

### Logging & Diagnostics

- `logger.info/error` wrappers output structured console logs with context (request IDs, entity IDs, counts).
- Certain APIs emit diagnostic payloads (e.g., `pm-budgets` returns `history` plus optional `diagnostics` about audit infrastructure).

### Security Considerations

- Session cookie is httpOnly and limited to 7 days in the current implementation.
- Middleware blocks unauthenticated API access except for explicitly public endpoints.
- File upload endpoints sanitize paths and extensions, enforce size/type limits, and guard against directory traversal.

### Pagination & Limits

- `parseQueryInt` normalizes `limit` and `offset` with defaults and hard caps, preventing unbounded queries.
- PM audit log and transactions list use this helper; other endpoints with potential pagination should adopt it for consistency.

## 5. Future Enhancements

- Replace stubbed auth endpoints with real provisioning & refresh logic (token-based sessions for mobile clients).
- Harden authorization across all routes (some rely on frontend discipline; double-check server-side guards before production).
- Expand audit coverage for supplier balance adjustments and warehouse transactions.
- Introduce consistent pagination & filtering to reports and high-volume lists.
- Add OpenAPI/Swagger generation to keep this documentation in sync programmatically.

For questions or updates, reference the relevant handler under `app/api/*` and supporting utilities in `lib/*`.
