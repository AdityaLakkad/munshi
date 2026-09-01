# CLAUDE.md

Guidance for Claude Code (or any AI coding agent) working in this repository.

## Project

**Munshi** — a multi-tenant SaaS cashbook/accounting web app for small businesses (CashBook, Sales, Purchases, Employees/Salary). Full requirements: `Munshi_SRS.md`. Full technical spec (schema, API contract, folder structure, build order): `SPECIFICATION.md`. **Read both before writing code.**

## Tech Stack

- Backend: Python 3.12, FastAPI, SQLAlchemy 2.0 (async), Alembic, Pydantic v2, PostgreSQL 16
- Frontend: Next.js 14 (App Router), TypeScript, shadcn/ui, Tailwind CSS, react-hook-form + zod, TanStack Query, TanStack Table
- Auth: JWT (access + refresh)
- Infra: Docker Compose (`api`, `web`, `db`)

## Non-Negotiable Rules

1. **Tenant isolation is the most important invariant in this app.** Every business table has `tenant_id`. Every query that touches business data MUST be scoped by the current user's `tenant_id`, via the shared `get_current_tenant` dependency — never write an endpoint that queries a business table without a tenant filter. If you're unsure how to scope a new query, look at an existing endpoint in the same module first.
2. **Never trust the client for `tenant_id`.** It always comes from the authenticated JWT/session server-side, never from a request body or query param.
3. Money fields are `NUMERIC(12,2)` in Postgres and should be handled as `Decimal` in Python — never `float`.
4. All list endpoints support pagination (`page`, `page_size`) and date-range filtering (`from`, `to`) where applicable — follow the existing pattern rather than inventing a new one per endpoint.
5. Any field that references another entity (customer, supplier, employee, item) must use the shadcn `Command`/combobox autocomplete pattern on the frontend, backed by a `/search/*` endpoint — not a plain `<select>` or free-text input.
6. Keep the UI **compact and data-dense** (shadcn defaults, not oversized marketing-style spacing) — this is an accounting tool used many times a day, not a landing page.
7. Every mutating cashbook-adjacent action (Sales Payment, Purchase Payment, Salary, Advance Salary, Transfer) must also create/link the corresponding `cashbook_entries` row — cashbook is the single source of truth for cash position. Never let sales/purchase/salary payments exist without a matching cashbook entry.

## Commands

```bash
# Start everything
docker compose up --build

# Backend only (from backend/)
uvicorn app.main:app --reload

# Run backend migrations
alembic upgrade head
alembic revision --autogenerate -m "message"

# Backend tests
pytest

# Frontend (from frontend/)
pnpm install
pnpm dev
pnpm build
pnpm lint
```

## Repository Layout

See `SPECIFICATION.md` §3 for the full tree. Key entry points:
- `backend/app/main.py` — FastAPI app + router registration
- `backend/app/core/deps.py` — `get_current_user`, `get_current_tenant`, DB session — start here for anything auth/tenant related
- `backend/app/api/v1/` — one router file per module, mirrors the sidebar nav
- `frontend/app/(app)/` — one route per module, mirrors the sidebar nav
- `frontend/components/ui/` — generated shadcn components — don't hand-edit; regenerate via `npx shadcn add <component>` if changes are needed
- `frontend/components/forms/` — one form per entry type, using react-hook-form + zod

## Conventions

- Backend: one SQLAlchemy model per file in `models/`, one Pydantic schema module per resource in `schemas/`, one router per resource in `api/v1/`. Business logic (ledger totals, outstanding calculations) belongs in `services/`, not inline in route handlers.
- Frontend: server components for data-heavy pages where possible; client components (`"use client"`) only where interactivity (forms, comboboxes, theme toggle) requires it.
- Naming: snake_case in Python/SQL, camelCase in TypeScript, kebab-case for file/route names in `app/`.
- Every new list/table view should reuse the shared `DataTable` component rather than a bespoke `<table>`.
- Every new form should use `zod` schemas shared (where sensible) between frontend validation and API request typing.

## What NOT to do

- Don't add a new top-level module outside Dashboard / CashBook / Sales / Purchases / Employees / Settings without checking with the user first — scope is intentionally minimal (see SRS §1.4 Out of Scope).
- Don't implement GST/tax, inventory/stock, multi-branch, payment gateways, or SaaS billing — explicitly out of scope for this version (SRS §10 Future Enhancements).
- Don't introduce a second state-management library beyond React Query + minimal Context/Zustand.
- Don't bypass `get_current_tenant` "just for now" — this is the one shortcut that will hurt later.

## Definition of Done (per module)

A module (e.g., Sales) is done when: CRUD endpoints exist and are tenant-scoped; corresponding cashbook entries are created where applicable; the frontend page has a compact DataTable, a create form with autocomplete fields, works responsively on mobile, respects light/dark theme, and shows toasts on success/error; a basic pytest covers create + tenant-isolation (tenant A cannot see tenant B's rows).
