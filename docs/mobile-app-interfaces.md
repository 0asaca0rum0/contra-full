# Mobile App Experience Guidelines

_Last updated: September 30, 2025_

This document outlines the recommended UX and interface structure for a companion mobile application that serves **Project Managers (PMs)** and **Administrators**. It is intentionally coupled to the existing Contra API and data model.

## 1. Audience & Design Principles

| Persona | Primary Goals | Devices |
|---------|---------------|---------|
| Project Manager (PM) | Track budgets, submit expenses with receipts, mark attendance, review supplier balances, monitor warehouse requests. | Android/iOS phones used on-site (potentially low connectivity). |
| Administrator | Oversee projects, manage users/permissions, audit budgets, review reports, monitor warehouse stock movements. | Phones & tablets; higher expectation of data density. |

**Design guardrails**

- Support RTL layouts and Arabic copy while preserving Western Arabic numerals in metrics (align with web UI).
- Minimize friction for on-site workflows (camera access for receipt upload, quick actions for attendance).
- Provide clear permission-based affordances — hide or disable modules when the user lacks access.
- Ensure offline resilience for capture workflows (draft transaction with receipt pending sync).

## 2. Technical Integration Overview

- **Auth**: The current API uses an httpOnly `uid` cookie. For mobile, introduce a token-based session (e.g., short-lived JWT + refresh token) or expose a dedicated login endpoint that returns a bearer token. Until then, mobile clients must store and resend cookies via `fetch`/`Axios` with `credentials: 'include'`.
- **Networking**: Use a thin REST client mapping to the endpoints listed in [`docs/api-overview.md`](./api-overview.md). Centralize retry/backoff and JSON envelope parsing (`success`, `error` patterns).
- **Uploads**: Integrate the `POST /api/receipts/presign` + `POST /api/files/upload` flow for receipts and `POST /api/warehouse/items/presign` for warehouse imagery. Handle multipart form upload in the native layer to improve reliability.
- **State Management**: Cache critical lists (projects, allocations, suppliers) locally with version timestamps to reduce load and allow offline previews.

## 3. Navigation Map

### Project Manager App Shell

```
Bottom Tabs: [Home] [Projects] [Attendance] [Warehouse] [Profile]
```

- **Home (Dashboard)**: Budget snapshot, recent expenses, outstanding approvals, quick links.
- **Projects**: List & search assigned projects, each revealing budget, spend, suppliers, and transactions.
- **Attendance**: Daily overview with quick mark-in/mark-out controls for assigned employees.
- **Warehouse**: Request stock movements, review recent transactions, attach supplier references.
- **Profile**: Personal info, role, permissions, language toggle, sign out.

### Administrator App Shell

```
Bottom Tabs (phone) or Side Rail (tablet): [Dashboard] [Users] [Projects] [Reports] [Inventory]
```

- **Dashboard**: Cross-project KPIs, alerts for overspending, recent audits.
- **Users**: Full CRUD on users, quick permission reset, invite workflow.
- **Projects**: Manage allocations, approve PM budget changes, access per-project activity.
- **Reports**: Visualizations for budgets, attendance trends, warehouse movement.
- **Inventory**: Manage warehouse items, tools, supplier balances.

## 4. Project Manager Experience

### 4.1 Home Dashboard

- **Widgets**
  - Remaining vs spent budgets aggregated across projects.
  - Last five transactions (from `GET /api/transactions?userId=me&limit=5`).
  - Outstanding approvals or alerts (e.g., allocation exceeded attempts).
- **Actions**
  - “New Expense” (deep link to capture flow).
  - “Scan Receipt” (camera + upload), chained to pre-sign + upload API.
  - Quick view of supplier balances for recent partners (`GET /api/suppliers?` with search cache).

### 4.2 Project Detail Screen

- **Data Sources**
  - `GET /api/pm/:userId/overview` for allocation, spend, expense list, audit history by project.
  - `GET /api/projects/:projectId/attendance` for workforce snapshot.
- **Sections**
  1. Budget card: allocated, spent, remaining, last audit entry.
  2. Expense timeline: list with receipt thumbnails; tap to view details or attach new receipt.
  3. Supplier engagement: transactions grouped by supplier with link to supplier overview.
  4. Resource tabs: employment roster (from `GET /api/employees?projectId=`), warehouse requests.

### 4.3 Expense Capture Flow

1. **Project & Supplier Selection**: pre-populated with current project; optional supplier search.
2. **Amount & Description**: enforce positive numeric entry (mirror Zod validation).
3. **Receipt Upload**: call `POST /api/receipts/presign`, then upload with progress UI, fallback to offline storage if upload fails.
4. **Submit**: `POST /api/projects/:projectId/expenses`. Handle API errors (`allocation_exceeded`, `insert_failed`) gracefully with actionable messaging.
5. **Confirmation & Sync**: Show result, link to “Attach more receipts” (calls `POST /api/transactions/:transactionId/receipt`).

### 4.4 Attendance

- **Daily Schedule View**: For each employee (`GET /api/attendance?projectId=...`) show present/absent toggles.
- **Mark Attendance**: On toggle, call `POST /api/attendance` with employee ID & present boolean. Provide undo within a short window.
- **Insights**: Display weekly presence trend from `GET /api/reports/attendance?groupBy=employee` scoped to PM projects.

### 4.5 Warehouse Module

- **Inventory Snapshot**: `GET /api/warehouse/items` (with search, quantity chips, optional images).
- **Transaction Form**: For each request, call `POST /api/warehouse/transactions` with IN/OUT selection, quantity, optional supplier ID. Validate errors like `insufficient_stock` and highlight required fields.
- **History Tab**: `GET /api/warehouse/items/:itemId/history` filtered for the PM’s projects (client-side filter using project IDs from PM assignments).

### 4.6 Profile & Settings

- Display name, username, role, and effective permissions (from `/api/auth/me`).
- Options: change language (RTL toggle), view audit trail (link to `/api/pm/:userId/budget-audit`), sign out (call `/api/auth/logout`).

## 5. Administrator Experience

### 5.1 Admin Dashboard

- **Top KPIs**: Total projects, overspent allocations, attendance compliance, warehouse alerts.
- **Newsfeed**: Recent PM budget adjustments (from `/api/reports/budgets`, `/api/pm/:userId/budget-audit`).
- **Callouts**: Pending approvals or anomalies flagged server-side.

### 5.2 User Management

- **User List**: Data from `GET /api/admin/users`, including role badges and createdAt.
- **Detail Drawer**: Show explicit vs default permissions (`GET /api/admin/users/:userId/permissions`), ability to reset or adjust.
- **Create User Flow**: `POST /api/admin/users` with inline validation (duplicate detection surfaces 409). Provide quick role-based permission presets.
- **Deactivate/Delete**: Before calling `DELETE /api/admin/users/:userId`, display dependent activity counts (extracted from error details if 409 occurs).

### 5.3 Project Oversight

- **Project List**: Extended view from `GET /api/projects` with search and filters.
- **Project Sheet**: Combine `GET /api/projects/:projectId`, `GET /api/projects/:projectId/pm-budgets`, `GET /api/projects/:projectId/expenses`, and `GET /api/projects/:projectId/members`.
- **Allocation Admin**: UI to add or adjust PM budgets (calls `POST /api/projects/:projectId/pm-budgets`). Include audit log viewer.
- **Deletion/Archiving**: Use `DELETE /api/projects/:projectId` with explicit `force` toggle. Explain dependencies before forced cascade.

### 5.4 Reports Module

- **Budget Trends**: Charts from `GET /api/reports/budgets`, filterable by project or PM.
- **Attendance Analytics**: Heatmaps using `GET /api/reports/attendance` (`groupBy=day` or `employee`).
- **Warehouse Movements**: `GET /api/reports/warehouse` for item usage, with ability to drill into item history.

### 5.5 Inventory & Tools

- **Warehouse Items**: Manage inventory via `POST/PUT /api/warehouse/items`, including imagery captured through `POST /api/warehouse/items/presign`.
- **Warehouse Transactions**: View chronological log and filter by project or supplier; allow manual corrections when necessary.
- **Tools Registry**: CRUD interface backed by `GET /api/tools`, `POST /api/tools`, `PATCH /api/tools/:toolId` with inline validation guidance.

## 6. Interaction Patterns & UI Components

- **Cards & Chips**: Mirror web styling with soft shadows and `tailwind-merge`-inspired utilities. Keep typography consistent (Arabic-friendly fonts).
- **Inline Alerts**: Surface server error codes (`allocation_exceeded`, `item_not_found`) with localized messaging and optional retry.
- **Skeleton States**: Provide shimmer placeholders for network-loaded sections; reuse across PM/Admin flows.
- **Search Inputs**: Debounce API calls, show cached results when offline.

## 7. Security & Session Management

- Adopt secure storage for credentials (Keychain/Keystore). Never store raw passwords.
- For cookie-based sessions, ensure all fetch calls include `credentials: 'include'`; however, migrating to token-based auth is strongly recommended. Extend API to issue refresh tokens for mobile.
- Implement role-based feature toggles by reading `permissions` field returned from `GET /api/auth/me` or `POST /api/auth/login`.
- Provide explicit sign-out with cookie clearance (`/api/auth/logout`) and local cache purge.

## 8. Offline & Sync Strategy

- Queue expense submissions and warehouse transactions when offline; replay once connectivity returns.
- Preserve captured receipts in local blob storage until upload succeeds; automatically retry using stored `uploadUrl` (bear in mind they expire — regenerate with `/api/receipts/presign` if needed).
- Cache read-only resources (projects list, supplier directory, tool list) with timestamps, allowing “last updated” indicators.

## 9. Future Enhancements

- Push notifications for allocation changes, approval requirements, or warehouse stockouts (requires server support).
- Biometric quick login (face/fingerprint) built atop token refresh flow.
- Role-based theming (e.g., accent colors indicating admin context).
- Embed analytics instrumentation (screen events, API latency) to monitor usage patterns.

By aligning the mobile app with these interface guidelines and the documented API surface, PMs and admins will gain a consistent, reliable field companion that mirrors the capabilities of the Contra web dashboard while respecting mobile-first constraints.
