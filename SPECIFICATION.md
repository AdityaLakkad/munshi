# Munshi — Technical Specification

**Companion to:** `Munshi_SRS.md` (product requirements)
**Purpose:** Implementation-ready spec — architecture, schema, API contracts, folder structure, and build order — meant to be handed to a coding agent (e.g. Claude Code) to build the app.

---

## 1. Product Summary

**Munshi** is a multi-tenant SaaS cashbook/accounting web app for small businesses: cashbook, sales, purchases, and employee salary management, with a rich shadcn/ui interface, autocomplete everywhere, and light/dark themes.

---

## 2. Tech Stack (Final)

| Layer | Choice |
|---|---|
| Backend | Python 3.12, **FastAPI**, SQLAlchemy 2.0 (async), Alembic (migrations), Pydantic v2 |
| Database | PostgreSQL 16 |
| Auth | JWT (access + refresh), `passlib[bcrypt]` for hashing |
| Frontend | Next.js 14 (App Router) + TypeScript |
| UI | shadcn/ui + Tailwind CSS + Radix primitives + `lucide-react` icons |
| Forms | `react-hook-form` + `zod` validation |
| Data fetching | `@tanstack/react-query` |
| State (theme, auth) | React Context / Zustand (small, minimal) |
| Package/dev | `uv` or `pip` (backend), `pnpm` (frontend) |
| Containerization | Docker + docker-compose (api, web, db) |

---

## 3. Repository Structure

```
munshi/
├── CLAUDE.md
├── SPECIFICATION.md
├── docker-compose.yml
├── .env.example
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── core/
│   │   │   ├── config.py          # settings via pydantic-settings
│   │   │   ├── security.py        # JWT, password hashing
│   │   │   └── deps.py            # get_current_user, get_tenant, DB session
│   │   ├── db/
│   │   │   ├── base.py
│   │   │   └── session.py
│   │   ├── models/                # SQLAlchemy models (one file per entity)
│   │   │   ├── tenant.py
│   │   │   ├── user.py
│   │   │   ├── customer.py
│   │   │   ├── supplier.py
│   │   │   ├── employee.py
│   │   │   ├── item.py
│   │   │   ├── cashbook.py
│   │   │   ├── sales.py
│   │   │   ├── purchases.py
│   │   │   └── salary.py
│   │   ├── schemas/                # Pydantic request/response schemas
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── router.py
│   │   │       ├── auth.py
│   │   │       ├── tenants.py
│   │   │       ├── users.py
│   │   │       ├── dashboard.py
│   │   │       ├── cashbook.py
│   │   │       ├── sales.py
│   │   │       ├── purchases.py
│   │   │       ├── employees.py
│   │   │       └── search.py       # autocomplete endpoints
│   │   └── services/               # business logic (ledger calc, outstanding calc)
│   ├── alembic/
│   ├── tests/
│   └── pyproject.toml
└── frontend/
    ├── app/
    │   ├── (auth)/login/page.tsx
    │   ├── (auth)/signup/page.tsx
    │   ├── (app)/dashboard/page.tsx
    │   ├── (app)/cashbook/page.tsx
    │   ├── (app)/sales/page.tsx
    │   ├── (app)/purchases/page.tsx
    │   ├── (app)/employees/page.tsx
    │   ├── (app)/settings/page.tsx
    │   └── layout.tsx
    ├── components/
    │   ├── ui/                     # shadcn generated components
    │   ├── layout/                 # Sidebar, Topbar, ThemeToggle, CommandPalette
    │   └── forms/                  # entry forms per module
    ├── lib/
    │   ├── api-client.ts
    │   ├── auth.ts
    │   └── hooks/
    ├── styles/globals.css
    └── package.json
```

---

## 4. Multi-Tenancy Rule (Non-negotiable)

Every business table has a `tenant_id` column. **Every** query touching business data must filter by the current user's `tenant_id`, enforced in a shared FastAPI dependency (`get_current_tenant`), never left to individual endpoints to remember. Recommended pattern:

```python
# core/deps.py
async def get_current_tenant(user: User = Depends(get_current_user)) -> UUID:
    return user.tenant_id

# every list/create/update/delete endpoint takes tenant_id: UUID = Depends(get_current_tenant)
# and every query includes .where(Model.tenant_id == tenant_id)
```

Optionally add PostgreSQL Row-Level Security as a second line of defense once the core app works.

---

## 5. Database Schema (SQL — reference for models/migrations)

```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TYPE user_role AS ENUM ('super_admin', 'firm_admin', 'staff', 'viewer');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),   -- NULL for super_admin
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role user_role NOT NULL,
  theme_preference TEXT DEFAULT 'system',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_customers_tenant_name_trgm ON customers USING gin (name gin_trgm_ops);

CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_suppliers_tenant_name_trgm ON suppliers USING gin (name gin_trgm_ops);

CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  designation TEXT,
  monthly_salary NUMERIC(12,2) NOT NULL DEFAULT 0,
  joining_date DATE,
  status TEXT NOT NULL DEFAULT 'active',   -- active | inactive
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  UNIQUE(tenant_id, name)
);

CREATE TYPE cashbook_type AS ENUM
  ('credit','debit','sales_payment','purchase_payment','salary','advance_salary','transfer');
CREATE TYPE payment_mode AS ENUM ('cash','bank','upi');

CREATE TABLE cashbook_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  entry_date DATE NOT NULL,
  type cashbook_type NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  mode payment_mode NOT NULL,
  category TEXT,                    -- for credit/debit
  linked_ref_type TEXT,             -- 'sales_payment' | 'purchase_payment' | 'salary' | ...
  linked_ref_id UUID,
  remarks TEXT,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sales_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  entry_date DATE NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id),
  item_desc TEXT,
  qty NUMERIC(12,2) DEFAULT 1,
  rate NUMERIC(12,2) NOT NULL,
  total_amount NUMERIC(12,2) NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sales_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  entry_date DATE NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id),
  sales_entry_id UUID REFERENCES sales_entries(id),
  amount NUMERIC(12,2) NOT NULL,
  mode payment_mode NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE purchase_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  entry_date DATE NOT NULL,
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  item_desc TEXT,
  qty NUMERIC(12,2) DEFAULT 1,
  rate NUMERIC(12,2) NOT NULL,
  total_amount NUMERIC(12,2) NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE purchase_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  entry_date DATE NOT NULL,
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  purchase_entry_id UUID REFERENCES purchase_entries(id),
  amount NUMERIC(12,2) NOT NULL,
  mode payment_mode NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE salary_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  employee_id UUID NOT NULL REFERENCES employees(id),
  entry_date DATE NOT NULL,
  period_month DATE NOT NULL,   -- store as first-of-month
  amount NUMERIC(12,2) NOT NULL,
  mode payment_mode NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE advance_salaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  employee_id UUID NOT NULL REFERENCES employees(id),
  entry_date DATE NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  adjusted_status TEXT NOT NULL DEFAULT 'pending',  -- pending | adjusted
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

*(Enable `pg_trgm` extension for trigram-based autocomplete: `CREATE EXTENSION IF NOT EXISTS pg_trgm;`)*

---

## 6. API Contract (v1) — Summary

Base URL: `/api/v1`. All business endpoints require `Authorization: Bearer <token>` and are tenant-scoped automatically from the token.

| Method | Path | Purpose |
|---|---|---|
| POST | `/auth/signup` | Create tenant + firm_admin user |
| POST | `/auth/login` | Returns access + refresh token |
| POST | `/auth/refresh` | Refresh access token |
| GET | `/users/me` | Current user + tenant info |
| POST | `/users` | Firm admin invites/creates staff/viewer |
| GET | `/dashboard` | Summary numbers for dashboard |
| GET/POST | `/cashbook` | List (filterable) / create cashbook entry |
| GET/POST | `/sales/entries` | List / create sales entries |
| GET/POST | `/sales/payments` | List / create sales payments |
| GET | `/sales/outstanding` | Customer-wise outstanding |
| GET/POST | `/purchases/entries` | List / create purchase entries |
| GET/POST | `/purchases/payments` | List / create purchase payments |
| GET | `/purchases/outstanding` | Supplier-wise outstanding |
| GET/POST | `/employees` | List / create employees |
| GET/POST | `/employees/salary` | List / create salary payments |
| GET/POST | `/employees/advance` | List / create advance salary |
| GET | `/employees/{id}/ledger` | Per-employee ledger |
| GET | `/search/customers?q=` | Autocomplete |
| GET | `/search/suppliers?q=` | Autocomplete |
| GET | `/search/employees?q=` | Autocomplete |
| GET | `/search/items?q=` | Autocomplete |
| GET | `/reports/{name}?format=csv` | CSV export |

All list endpoints support `?from=&to=&page=&page_size=` query params.

---

## 7. Frontend Notes

- Use shadcn `Command` component (`cmdk`-based) for every autocomplete field, wired to the relevant `/search/*` endpoint with debounce (~250ms).
- Global theme: `next-themes` package + Tailwind `dark:` classes; toggle in top bar, persisted via cookie/localStorage.
- Sidebar: Dashboard, CashBook, Sales, Purchases, Employees, Settings — collapsible, becomes bottom nav on mobile (`< 768px`).
- Command palette (⌘K) using shadcn `CommandDialog`, actions: "New Sale", "New Purchase", "New Credit", "New Debit", "Go to Customer...".
- All money tables: shadcn `DataTable` pattern (TanStack Table + shadcn styling) with column sort, date-range filter, CSV export button.

---

## 8. Build Order (Milestones)

1. **Foundation** — repo scaffold, Docker Compose (db, api, web), `.env` config, Alembic migration for schema above, health-check endpoint.
2. **Auth & Tenancy** — signup, login, JWT, tenant-scoped `get_current_user`/`get_current_tenant` dependency, frontend login/signup pages + auth context.
3. **Shell UI** — sidebar, topbar, theme toggle, command palette skeleton, protected route wrapper in Next.js.
4. **Masters** — Customers, Suppliers, Employees CRUD + autocomplete search endpoints and components.
5. **CashBook module** — all 7 entry types, ledger table with running balance.
6. **Sales module** — entries, payments, outstanding report.
7. **Purchases module** — entries, payments, outstanding report.
8. **Employees module** — salary, advance salary, employee ledger.
9. **Dashboard** — aggregate summary queries + widgets.
10. **Reports & CSV export**.
11. **Polish** — toasts, skeleton loaders, empty states, responsive pass, accessibility check.

---

## 9. Environment Variables (`.env.example`)

```
# Backend
DATABASE_URL=postgresql+asyncpg://munshi:munshi@db:5432/munshi
JWT_SECRET=change-me
JWT_ACCESS_EXPIRE_MINUTES=30
JWT_REFRESH_EXPIRE_DAYS=7

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

---

*End of Specification*
