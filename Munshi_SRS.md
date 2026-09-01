# Software Requirements Specification (SRS)
## Product: **Munshi**
### CashBook & Business Management SaaS Application

**Version:** 2.0
**Prepared for:** Multi-tenant SaaS (multiple small businesses/firms, each isolated)
**Date:** August 31, 2026

---

## 1. Introduction

### 1.1 Purpose
This document specifies the requirements for a multi-tenant SaaS web application covering cash book, sales, purchases, and employee/salary management. Each subscribing firm (tenant) gets its own isolated data and users, all served from a single shared application.

### 1.2 Scope
The system will allow any number of small businesses to sign up as independent tenants and, within their own workspace, record daily cash transactions, manage sales and purchases, track customer/supplier outstanding balances, and manage employee salary records — from a rich, modern web app usable on desktop and mobile.

### 1.3 Assumptions
- Multi-tenant SaaS: each firm's data is logically isolated (shared database, tenant-scoped rows — simplest and cheapest to run at small-business scale; not separate DB-per-tenant).
- Each tenant is a single business/single location internally (no multi-branch within a tenant, for now).
- Single currency per tenant (INR default; configurable per tenant).
- Small-to-moderate scale: tens to low hundreds of tenants, each with a handful of users (1–15) — not enterprise/high-volume scale.
- No GST/tax filing, e-invoicing, or government compliance integration (future enhancement).
- No payment gateway integration for end-customer payments; all business payments recorded manually (Cash/Bank/UPI as an enum field). Subscription billing for tenants (if monetized) is a separate future concern.
- Internet-connected environment; no offline mode required.

### 1.4 Out of Scope
- Inventory/stock management (beyond simple qty on sales/purchase line items)
- Payroll tax computation, PF/ESI compliance
- Advanced BI/analytics, GST returns
- Native mobile apps (a mobile-friendly, installable responsive web app — PWA — covers this)
- Multi-branch support within a single tenant
- Automated SaaS billing/metering (tenant onboarding assumed manual/admin-driven initially)

---

## 2. Overall Description

### 2.1 Product Perspective
A cloud-hosted, multi-tenant SaaS application with a decoupled architecture: a rich single-page frontend (React + shadcn/ui) talking to a Python REST API backend, backed by a shared relational database with tenant-scoped data. Fully responsive and mobile-friendly, with light/dark theme support.

### 2.2 Tenancy Model
- **Tenant (Firm):** Each business that signs up is a Tenant, identified by a unique `tenant_id` / subdomain (e.g., `acmetraders.app.com`) or workspace slug.
- **Data isolation:** Every business record (Customer, Supplier, Employee, CashbookEntry, SalesEntry, PurchaseEntry, etc.) is scoped by `tenant_id`. All queries are automatically filtered by the logged-in user's tenant — enforced at the API/ORM layer so no tenant can ever see another tenant's data.
- **Onboarding:** A simple sign-up flow creates a new Tenant + its first Admin user (firm owner).

### 2.3 User Roles
| Role | Scope | Permissions |
|---|---|---|
| **Super Admin** (platform owner) | Cross-tenant | Manage tenants, view platform usage, support access — not part of daily business workflows |
| **Firm Admin/Owner** | Single tenant | Full access within their firm: all modules, user management, delete/edit any record, theme/settings |
| **Staff/Accountant** | Single tenant | Create/view entries in Cashbook, Sales, Purchases, Employees; limited edit; no user management |
| **Viewer** (optional) | Single tenant | Read-only access to reports/ledgers |

### 2.4 General Constraints
- Python-based backend (FastAPI recommended for a clean, typed REST API powering a rich SPA).
- React + shadcn/ui frontend, fully responsive, with light/dark mode toggle.
- Multi-tenant data isolation is a hard requirement, enforced server-side (never trust the client for tenant scoping).

---

## 3. System Architecture (High Level)

- **Frontend:** React (Next.js) SPA/PWA using **shadcn/ui** (built on Radix + Tailwind CSS) for a compact, modern, accessible component library. Mobile-first, installable as a PWA.
- **Backend:** Python **FastAPI** exposing a versioned REST API (`/api/v1/...`), with Pydantic-based validation.
- **Database:** PostgreSQL — shared database, tenant-scoped tables (`tenant_id` foreign key + row-level filtering; Postgres Row-Level Security optionally enabled for defense-in-depth).
- **Authentication:** JWT-based auth (access + refresh tokens), tenant context embedded in the token/session; password hashing via bcrypt/argon2.
- **Caching/Search support:** Lightweight in-DB indexed search (Postgres `ILIKE`/trigram index) to power autocomplete fields — no separate search engine needed at this scale.
- **Hosting:** Single cloud VM or small managed-container setup (e.g., a small app-service instance + managed Postgres) — scalable later without re-architecture, since API and frontend are already decoupled.

**Recommended stack:** FastAPI + SQLAlchemy + PostgreSQL (backend) · Next.js + TypeScript + shadcn/ui + Tailwind CSS (frontend) · JWT auth · deployed via Docker on a single small cloud instance, growing to managed services as tenant count increases.

---

## 4. UI/UX Requirements (Rich, Compact, shadcn-based)

- **Design system:** shadcn/ui components throughout (Table, Command/Combobox, Dialog, Sheet, Dropdown, Tabs, Badge, Toast, Skeleton loaders) for a consistent, modern, compact look — dense data tables suited to accounting-style entry, not oversized marketing-style UI.
- **Theme:** Global **light/dark mode toggle** (persisted per user), using Tailwind's dark mode + CSS variables; system-preference auto-detect on first load.
- **Autocomplete everywhere applicable:** Any field referencing an existing record uses a searchable autocomplete/combobox (shadcn `Command` component) instead of plain dropdowns or free text, including:
  - Customer selection (Sales Entry, Sales Payment)
  - Supplier selection (Purchase Entry, Purchase Payment)
  - Employee selection (Salary, Advance Salary, Employee Ledger)
  - Item/product description (if a reusable item list is maintained)
  - Category/remarks tags in Credit/Debit entries (suggest previously used categories)
  - Global search bar (jump to any customer, supplier, employee, or transaction by typing)
- **Compact data-dense tables:** Sortable, filterable tables for ledgers (Cashbook, Sales, Purchases, Employee Ledger) with inline pagination, column filters, and quick date-range pickers.
- **Responsive layout:** Sidebar navigation collapses to a bottom/hamburger nav on mobile; forms stack vertically on small screens; touch-friendly input sizing.
- **Feedback & polish:** Toast notifications for save/error states, optimistic UI updates where safe, skeleton loaders while data fetches, empty-state illustrations for first-time tenants.
- **Keyboard-friendly:** Command palette (⌘K / Ctrl+K) for power users to quickly jump to "New Sale", "New Credit Entry", etc.

---

## 5. Functional Requirements

### 5.1 Dashboard
- FR-1.1: Show today's cash-in-hand / bank balance summary (tenant-scoped).
- FR-1.2: Show total sales, purchases, and outstanding (receivable/payable) for current month.
- FR-1.3: Quick-add shortcuts (buttons + command palette): Credit, Debit, Sales Entry, Purchase Entry.
- FR-1.4: Recent transactions feed (last 10–15 entries across modules).
- FR-1.5: Light/dark theme toggle accessible from the dashboard header on every page.

### 5.2 CashBook Module
- FR-2.1 **Credit**: Record cash/bank inflow — date, amount, source/category (autocomplete from previously used categories), remarks.
- FR-2.2 **Debit**: Record cash/bank outflow — date, amount, category (autocomplete), remarks.
- FR-2.3 **Sales Payment**: Record payment received against a customer (customer field via autocomplete), auto-updates customer outstanding.
- FR-2.4 **Purchase Entry**: Linked purchase transaction, reflected here as an outflow event.
- FR-2.5 **Employee Salary**: Record salary paid to an employee (employee via autocomplete).
- FR-2.6 **Advance Salary**: Record advance paid to employee (employee via autocomplete); reduces future salary due.
- FR-2.7 **Transfers**: Record transfer between cash and bank/other accounts, maintaining balances on both sides.
- FR-2.8: Every cashbook entry stores: date, type, amount, mode (Cash/Bank/UPI), reference/remarks, created-by user, tenant_id.
- FR-2.9: Running ledger view (date-wise) with running balance, filterable by date range and type, in a compact sortable table.

### 5.3 Sales Module
- FR-3.1 **Sales Entry**: Create a sale — customer via autocomplete (or "+ new customer" inline), date, item description (autocomplete from item history), quantity, rate, total amount (auto-calculated).
- FR-3.2 **Sales Payment**: Record full/partial payment against a sale, reflected in CashBook.
- FR-3.3 **Customer Outstanding**: Auto-calculated ledger per customer (total sales – payments received); compact table with search/autocomplete filter by customer.
- FR-3.4: Customer master (name, phone, address) with inline quick-add and autocomplete search across the app.

### 5.4 Purchases Module
- FR-4.1 **Purchase Entry**: Create purchase — supplier via autocomplete (or inline "+ new supplier"), date, item description (autocomplete), quantity, rate, total amount (auto-calculated).
- FR-4.2 **Purchase Payment**: Record full/partial payment to supplier, reflected in CashBook.
- FR-4.3 **Supplier Outstanding**: Auto-calculated ledger per supplier; compact searchable table.
- FR-4.4: Supplier master (name, phone, address) with autocomplete search.

### 5.5 Employees Module
- FR-5.1 **Employee List**: Add/edit/view employees — name, designation, joining date, monthly salary, contact, active/inactive status; searchable/autocomplete list.
- FR-5.2 **Salary**: Record monthly salary payment per employee (employee via autocomplete), reflected in CashBook.
- FR-5.3 **Advance Salary**: Record advance given to an employee; auto-adjusted against next salary payment.
- FR-5.4 **Employee Ledger**: Per-employee statement — salary paid, advances given/adjusted, running due — with date filters.

### 5.6 Tenant & User Management (New)
- FR-6.1: Self-service sign-up creates a new Tenant + Firm Admin account.
- FR-6.2: Firm Admin can invite/add Staff/Viewer users within their tenant.
- FR-6.3: Firm Admin can manage tenant-level settings: firm name, currency, logo, theme default.
- FR-6.4: Super Admin (platform) can view/manage the list of tenants for support purposes, without accessing tenant business data directly.

---

## 6. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Multi-tenancy & Isolation** | Strict server-side tenant scoping on every query; one tenant must never see another's data, even via API manipulation |
| **Usability** | Compact, modern shadcn-based UI; autocomplete on all reference fields; minimal clicks to complete common entries |
| **Theming** | Light/dark mode toggle, persisted per user, with system-preference default |
| **Performance** | Sub-second response for typical CRUD/list operations; autocomplete queries return in <300ms |
| **Security** | JWT auth, hashed passwords, role-based + tenant-based access control, HTTPS everywhere |
| **Data Backup** | Daily automated database backup (tenant-safe restore process) |
| **Scalability** | Architecture (decoupled API + SPA, shared DB with tenant scoping) supports growing from a handful to hundreds of tenants without redesign |
| **Auditability** | Each entry stores created-by user, tenant_id, and timestamp; edits/deletes logged |
| **Portability** | Any report/table exportable to CSV/Excel |
| **Accessibility** | shadcn/Radix components provide baseline keyboard & screen-reader accessibility out of the box |

---

## 7. Data Model Overview (Key Entities)

- **Tenant** (id, name, slug, currency, logo_url, created_at)
- **User** (id, tenant_id [nullable for Super Admin], name, username/email, password_hash, role)
- **Customer** (id, tenant_id, name, phone, address)
- **Supplier** (id, tenant_id, name, phone, address)
- **Employee** (id, tenant_id, name, designation, salary, joining_date, status)
- **Item** (id, tenant_id, name) — lightweight, powers item-description autocomplete
- **CashbookEntry** (id, tenant_id, date, type[Credit/Debit/SalesPayment/PurchaseEntry/Salary/AdvanceSalary/Transfer], amount, mode, linked_ref_id, remarks, created_by)
- **SalesEntry** (id, tenant_id, date, customer_id, item_desc, qty, rate, total_amount)
- **SalesPayment** (id, tenant_id, date, customer_id, sales_entry_id (optional), amount, mode)
- **PurchaseEntry** (id, tenant_id, date, supplier_id, item_desc, qty, rate, total_amount)
- **PurchasePayment** (id, tenant_id, date, supplier_id, purchase_entry_id (optional), amount, mode)
- **SalaryPayment** (id, tenant_id, employee_id, date, period_month, amount, mode)
- **AdvanceSalary** (id, tenant_id, employee_id, date, amount, adjusted_status)

*Every business table carries `tenant_id`, indexed, with server-side enforcement (e.g., SQLAlchemy query filters or Postgres RLS) so tenant scoping cannot be bypassed from the API layer.*

---

## 8. Reports (Minimal Set)

- Cashbook ledger (date-range filter)
- Customer-wise outstanding report
- Supplier-wise outstanding report
- Employee salary/ledger report
- Monthly summary (total sales, purchases, salary paid, net cash flow)
- Export any report to CSV/Excel

---

## 9. Technology Stack Recommendation

| Layer | Choice |
|---|---|
| Backend | Python — **FastAPI** + SQLAlchemy (typed, fast, clean REST API for a decoupled SPA) |
| Database | PostgreSQL (shared DB, tenant-scoped; trigram index for autocomplete search) |
| Frontend | **Next.js (React + TypeScript)** + **shadcn/ui** + Tailwind CSS |
| Autocomplete | shadcn `Command`/Combobox components + FastAPI search endpoints (Postgres `ILIKE`/trigram) |
| Auth | JWT (access + refresh tokens), tenant context in token claims |
| Theme | Tailwind dark-mode class strategy + CSS variables, toggle stored in user preferences |
| Deployment | Dockerized services (API + frontend), single small cloud instance to start; managed Postgres |
| Backup | Daily `pg_dump` cron job to cloud storage |

---

## 10. Future Enhancements (Not in Current Scope)
- GST/tax computation and invoice printing
- Inventory/stock tracking with reorder alerts
- Multi-branch support within a tenant
- Payment gateway / bank integration for end-customer payments
- Automated SaaS subscription billing & plan tiers for tenants
- SMS/WhatsApp notifications for outstanding dues
- Fine-grained, configurable role permissions and approval workflows

---

*End of Document*
