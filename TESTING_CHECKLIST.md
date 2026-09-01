# Munshi — Manual Testing Checklist

App: http://localhost:3000 · API docs: http://localhost:8000/docs

**Existing test accounts:**
- `alice@acme.com` / `password123` (tenant: Acme Traders)
- `bob@beta.com` / `password123` (tenant: Beta Traders) — used for tenant-isolation checks

---

## 1. Auth & shell
- [ ] Sign up a brand-new firm at `/signup` → should land on `/dashboard` immediately (no extra login step)
- [ ] Log out (icon button, top-right) → should redirect to `/login`
- [ ] Visit `/dashboard` while logged out → should bounce to `/login`, not show stale data
- [ ] Toggle light/dark theme → persists across a page refresh
- [ ] Press `⌘K`/`Ctrl+K` anywhere in the app → command palette opens; try a "Go to" and a "Quick add" item
- [ ] Resize to mobile width → sidebar becomes a bottom nav bar

## 2. Employees (Masters)
- [ ] Add an employee (name, designation, salary, joining date, status)
- [ ] Search box filters the list as you type
- [ ] Table paginates correctly if you add >20 employees (or just check Prev/Next disable at boundaries)

## 3. CashBook
- [ ] Add a Credit and a Debit → both appear in the ledger with correct running balance
- [ ] Add a Transfer (cash → bank) → creates two rows, balance unaffected overall
- [ ] Try transferring cash → cash → should show a validation error, not submit
- [ ] Filter by date range and by type → list narrows correctly, balance column stays mathematically consistent
- [ ] Export CSV → file downloads with the visible filter applied

## 4. Sales
- [ ] Create a sale: use the customer combobox, type a name that doesn't exist yet, click the "+" to quick-add it inline, confirm it auto-selects
- [ ] Confirm total = qty × rate auto-calculates in the form before saving
- [ ] Record a partial payment against that customer → check it shows up in CashBook as `sales_payment`
- [ ] Outstanding tab shows total sales − total paid for that customer
- [ ] Export CSV on the Outstanding tab

## 5. Purchases
- [ ] Same flow as Sales but with a supplier — entry, payment, outstanding, CSV export
- [ ] Confirm a purchase payment shows as a negative (outflow) in CashBook

## 6. Employees — Salary & Advance
- [ ] Pay salary for an employee for a given month → check CashBook shows the outflow
- [ ] Give an advance → shows "pending" in the Advance tab
- [ ] Click "Mark adjusted" → status flips, and the employee's Ledger dialog (via "Ledger" button on the Employees tab) shows outstanding advances drop to 0
- [ ] Export Salary CSV

## 7. Dashboard
- [ ] Numbers (cash in hand, bank balance, sales/purchases this month, receivable/payable) look consistent with what you entered
- [ ] Recent transactions feed shows your latest actions across modules
- [ ] Quick-add buttons (Credit/Debit/Sale/Purchase) work from here too

## 8. Tenant isolation (the important one)
- [ ] Log in as `bob@beta.com` → should see **zero** of Alice's customers, sales, cashbook entries, employees, etc.
- [ ] Try typing a known Acme customer name into Bob's sales-entry combobox → should not appear in search results

---

## Known gaps / simplifications (not bugs)
- Settings page is still a placeholder (not in the numbered Build Order).
- Advance-salary adjustment is a manual "Mark adjusted" toggle, not auto-deducted from the next salary payment.
- Backend tests run against the same dev database (randomized names avoid collisions, but it's not an isolated test DB).
