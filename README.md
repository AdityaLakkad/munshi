# Munshi

Multi-tenant SaaS cashbook/accounting web app for small businesses — CashBook, Sales, Purchases, and Employee/Salary management, with a compact shadcn/ui interface, autocomplete everywhere, and light/dark themes.

## Quick run

```bash
git clone git@github.com:AdityaLakkad/munshi.git
cd munshi
cp backend/.env.example backend/.env
docker compose up --build -d
docker compose exec api alembic upgrade head
docker compose exec api python -m app.db.seed
```

Open **http://localhost:7030** and log in with `demo@munshitraders.com` / `password123` to see a populated demo tenant. Details, other ports, and options below.

## Read these first (in order)

1. **`Munshi_SRS.md`** — product requirements: what the app does and why.
2. **`SPECIFICATION.md`** — technical spec: architecture, DB schema, API contract, folder structure, and the milestone-by-milestone build order.
3. **`CLAUDE.md`** — rules and conventions for any AI coding agent (or human) working in this repo. Read this before writing code.

## Ports

All exposed ports live in the **7010–7090** range to avoid clashing with other local services:

| Service              | Host port | Container port | URL                          |
|----------------------|-----------|-----------------|-------------------------------|
| `web` (Next.js)       | 7030      | 3000            | http://localhost:7030         |
| `api` (FastAPI)       | 7020      | 8000            | http://localhost:7020          |
| `api` docs (Swagger)  | 7020      | 8000            | http://localhost:7020/docs     |
| `db` (Postgres)       | 7010      | 5432            | `localhost:7010` (psql/DBeaver) |

## Setup — build and run with Docker

```bash
# 1. Clone and enter the repo
git clone git@github.com:AdityaLakkad/munshi.git
cd munshi

# 2. Create the backend env file
cp backend/.env.example backend/.env
# Defaults work out of the box for local dev — adjust JWT_SECRET etc. before deploying anywhere real.

# 3. Build the images and start everything (db, api, web)
docker compose up --build -d

# 4. Run database migrations (first time, or after pulling schema changes)
docker compose exec api alembic upgrade head
```

That's it — the app is now up:

- **Web app:** http://localhost:7030
- **API:** http://localhost:7020 (interactive docs at http://localhost:7020/docs)
- **Postgres:** `localhost:7010`, db `munshi`, user `munshi`, password `munshi`

Check everything is healthy:

```bash
docker compose ps
curl http://localhost:7020/health   # {"status":"ok"}
```

## Seeding demo/temp company data

The app ships with a seed script that creates one fully-populated demo tenant — customers, suppliers, employees, cashbook entries, a sale + payment, a purchase + payment, a salary payment, and an advance — so you can click through the whole app without manually filling in every form first. It's **idempotent**: running it again is a no-op once the demo tenant exists.

**Option A — run it on demand (recommended):**

```bash
docker compose exec api python -m app.db.seed
```

**Option B — seed automatically on every API startup:**

In `backend/.env`, set:

```
SEED_DEMO_DATA=true
```

then `docker compose restart api`. Safe to leave on permanently — it only seeds once and skips silently after that.

**Demo login (once seeded):**

```
Email:    demo@munshitraders.com
Password: password123
```

Log in at http://localhost:7030 with those credentials to see a populated dashboard, cashbook, sales, purchases, and employees for the tenant "Demo Traders."

## Common commands

```bash
# View logs
docker compose logs -f api
docker compose logs -f web

# Stop everything (keeps data volume)
docker compose down

# Stop and wipe the database completely
docker compose down -v

# Generate a new migration after model changes
docker compose exec api alembic revision --autogenerate -m "message"
docker compose exec api alembic upgrade head

# Open a psql shell
docker compose exec db psql -U munshi -d munshi
```

## Local (non-Docker) dev

```bash
# Backend
cd backend
pip install -e ".[dev]"
uvicorn app.main:app --reload   # runs on :8000 by default outside Docker

# Frontend
cd frontend
npm install
npm run dev                      # runs on :3000 by default outside Docker
```

If you run the frontend outside Docker, point it at the API with:

```
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

## What's already built

- Docker Compose for `db` (Postgres 16), `api` (FastAPI), `web` (Next.js 14)
- Full auth flow: signup (creates a Tenant + firm_admin User) and login, JWT access + refresh
- SQLAlchemy models for every entity in the schema, with a `TenantScopedMixin` enforcing `tenant_id` on every business table
- Alembic migrations
- CashBook, Sales, Purchases, Employees/Salary, Customers/Suppliers modules with tenant-scoped CRUD, autocomplete fields, and a compact DataTable-based UI
- Dashboard with real aggregated data, Reports/CSV export
- Light/dark theme, responsive layout (sidebar + mobile bottom nav)

See `SPECIFICATION.md` §8 for the full build order and `TESTING_CHECKLIST.md` for what's been manually verified.

## How to continue development (recommended: Claude Code)

Open this folder in Claude Code — it already has `CLAUDE.md`, `SPECIFICATION.md`, and `Munshi_SRS.md` for context. After any schema or module change, run the seed script and click through the affected module before calling it done, and if you touch tenant-scoping, manually sign up two tenants and confirm tenant A cannot see tenant B's data.
