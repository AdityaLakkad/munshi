# Munshi

Multi-tenant SaaS cashbook/accounting web app for small businesses — CashBook, Sales, Purchases, and Employee/Salary management, with a compact shadcn/ui interface, autocomplete everywhere, and light/dark themes.

## Read these first (in order)

1. **`Munshi_SRS.md`** — product requirements: what the app does and why.
2. **`SPECIFICATION.md`** — technical spec: architecture, DB schema, API contract, folder structure, and the milestone-by-milestone build order.
3. **`CLAUDE.md`** — rules and conventions for any AI coding agent (or human) working in this repo. Read this before writing code.

## What's already scaffolded (Milestone 1: Foundation)

- Docker Compose for `db` (Postgres), `api` (FastAPI), `web` (Next.js)
- FastAPI app with a `/health` endpoint, CORS, and a working `/api/v1/auth/signup` + `/api/v1/auth/login` (creates a Tenant + firm_admin User, returns JWT)
- SQLAlchemy models for every entity in the schema (`backend/app/models/`), with a `TenantScopedMixin` enforcing `tenant_id` on every business table
- Alembic configured for async migrations (no migration generated yet — see Quick Start below)
- `get_current_user` / `get_current_tenant` FastAPI dependencies (`backend/app/core/deps.py`) — **every future endpoint must use these to scope queries**
- Next.js App Router shell: theme provider (light/dark via `next-themes`), sidebar + mobile bottom nav, top bar, login/signup pages wired to the real auth API, a placeholder dashboard, and empty placeholder pages for CashBook/Sales/Purchases/Employees/Settings
- A handful of hand-authored shadcn-style base components (`button`, `card`, `input`, `label`) as a pattern to follow — generate the rest (`Command`, `Table`, `Dialog`, `Toast`, etc.) via the shadcn CLI as you build each module

## What's NOT built yet

Everything past Milestone 2 in `SPECIFICATION.md` §8: Customers/Suppliers/Employees CRUD + autocomplete, CashBook entries, Sales, Purchases, real Dashboard data, Reports/CSV export. This is intentional — see the "How to continue" section below.

## Quick Start

```bash
# 1. Copy env files (already done for backend/.env; adjust secrets as needed)
cp .env.example backend/.env   # if you need to regenerate it

# 2. Start Postgres, API, and web together
docker compose up --build

# 3. In a separate terminal, generate and run the first migration
docker compose exec api alembic revision --autogenerate -m "initial schema"
docker compose exec api alembic upgrade head
```

- API: http://localhost:8000 (docs at http://localhost:8000/docs)
- Web: http://localhost:3000

Frontend dependencies aren't pre-installed in this zip (no `node_modules`) — `docker compose up --build` installs them inside the container on first run. For local (non-Docker) frontend dev: `cd frontend && npm install && npm run dev`. For local backend dev: `cd backend && pip install -e ".[dev]"` then `uvicorn app.main:app --reload`.

## How to continue development (recommended: Claude Code)

Open this folder in Claude Code and give it one instruction:

> Read CLAUDE.md, SPECIFICATION.md, and Munshi_SRS.md. Build this project following the Build Order in SPECIFICATION.md §8, starting from Milestone 3 (Milestones 1 and 2 are already scaffolded — verify them, then continue). After each milestone, run the app/tests and confirm it works before moving to the next.

Then keep saying "continue to the next milestone." After Milestone 2 is verified, manually sign up two different tenants and confirm tenant A cannot see tenant B's data — the one thing worth checking by hand rather than trusting blindly.
