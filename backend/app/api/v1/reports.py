import csv
import io
import uuid
from collections import defaultdict
from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_tenant
from app.db.session import get_db
from app.models.cashbook import CashbookEntry
from app.models.customer import Customer
from app.models.employee import Employee
from app.models.purchases import PurchaseEntry, PurchasePayment
from app.models.salary import SalaryPayment
from app.models.sales import SalesEntry, SalesPayment
from app.models.supplier import Supplier

router = APIRouter()

KNOWN_REPORTS = {"cashbook", "sales-outstanding", "purchases-outstanding", "salary", "monthly-summary"}


def _csv_response(filename: str, header: list[str], rows: list[list]) -> StreamingResponse:
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(header)
    writer.writerows(rows)
    buffer.seek(0)
    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}.csv"'},
    )


@router.get("/{name}")
async def export_report(
    name: str,
    format: str = Query("csv"),
    from_: date | None = Query(None, alias="from"),
    to: date | None = None,
    tenant_id: uuid.UUID = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
) -> StreamingResponse:
    if name not in KNOWN_REPORTS:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unknown report")
    if format != "csv":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only format=csv is supported")

    if name == "cashbook":
        stmt = select(CashbookEntry).where(CashbookEntry.tenant_id == tenant_id)
        if from_:
            stmt = stmt.where(CashbookEntry.entry_date >= from_)
        if to:
            stmt = stmt.where(CashbookEntry.entry_date <= to)
        rows = (await db.execute(stmt.order_by(CashbookEntry.entry_date))).scalars().all()
        data = [
            [r.entry_date, r.type.value, r.amount, r.mode.value, r.category or "", r.remarks or ""]
            for r in rows
        ]
        return _csv_response("cashbook", ["Date", "Type", "Amount", "Mode", "Category", "Remarks"], data)

    if name == "sales-outstanding":
        sales_totals = (
            select(SalesEntry.customer_id, func.sum(SalesEntry.total_amount).label("total_sales"))
            .where(SalesEntry.tenant_id == tenant_id)
            .group_by(SalesEntry.customer_id)
            .subquery()
        )
        payment_totals = (
            select(SalesPayment.customer_id, func.sum(SalesPayment.amount).label("total_paid"))
            .where(SalesPayment.tenant_id == tenant_id)
            .group_by(SalesPayment.customer_id)
            .subquery()
        )
        stmt = (
            select(
                Customer.name,
                func.coalesce(sales_totals.c.total_sales, 0),
                func.coalesce(payment_totals.c.total_paid, 0),
            )
            .select_from(Customer)
            .outerjoin(sales_totals, sales_totals.c.customer_id == Customer.id)
            .outerjoin(payment_totals, payment_totals.c.customer_id == Customer.id)
            .where(Customer.tenant_id == tenant_id)
            .where((sales_totals.c.total_sales.isnot(None)) | (payment_totals.c.total_paid.isnot(None)))
            .order_by(Customer.name)
        )
        rows = (await db.execute(stmt)).all()
        data = [[name_, sales, paid, Decimal(sales) - Decimal(paid)] for name_, sales, paid in rows]
        return _csv_response(
            "sales-outstanding", ["Customer", "Total Sales", "Total Paid", "Outstanding"], data
        )

    if name == "purchases-outstanding":
        purchase_totals = (
            select(PurchaseEntry.supplier_id, func.sum(PurchaseEntry.total_amount).label("total_purchases"))
            .where(PurchaseEntry.tenant_id == tenant_id)
            .group_by(PurchaseEntry.supplier_id)
            .subquery()
        )
        payment_totals = (
            select(PurchasePayment.supplier_id, func.sum(PurchasePayment.amount).label("total_paid"))
            .where(PurchasePayment.tenant_id == tenant_id)
            .group_by(PurchasePayment.supplier_id)
            .subquery()
        )
        stmt = (
            select(
                Supplier.name,
                func.coalesce(purchase_totals.c.total_purchases, 0),
                func.coalesce(payment_totals.c.total_paid, 0),
            )
            .select_from(Supplier)
            .outerjoin(purchase_totals, purchase_totals.c.supplier_id == Supplier.id)
            .outerjoin(payment_totals, payment_totals.c.supplier_id == Supplier.id)
            .where(Supplier.tenant_id == tenant_id)
            .where((purchase_totals.c.total_purchases.isnot(None)) | (payment_totals.c.total_paid.isnot(None)))
            .order_by(Supplier.name)
        )
        rows = (await db.execute(stmt)).all()
        data = [[name_, purchases, paid, Decimal(purchases) - Decimal(paid)] for name_, purchases, paid in rows]
        return _csv_response(
            "purchases-outstanding", ["Supplier", "Total Purchases", "Total Paid", "Outstanding"], data
        )

    if name == "salary":
        stmt = (
            select(SalaryPayment, Employee.name)
            .join(Employee, Employee.id == SalaryPayment.employee_id)
            .where(SalaryPayment.tenant_id == tenant_id)
        )
        if from_:
            stmt = stmt.where(SalaryPayment.entry_date >= from_)
        if to:
            stmt = stmt.where(SalaryPayment.entry_date <= to)
        rows = (await db.execute(stmt.order_by(SalaryPayment.entry_date))).all()
        data = [
            [payment.entry_date, employee_name, payment.period_month, payment.amount, payment.mode.value]
            for payment, employee_name in rows
        ]
        return _csv_response(
            "salary", ["Paid On", "Employee", "For Month", "Amount", "Mode"], data
        )

    # monthly-summary
    sales_by_month = await _sum_by_month(db, SalesEntry.entry_date, SalesEntry.total_amount, SalesEntry.tenant_id, tenant_id)
    purchases_by_month = await _sum_by_month(
        db, PurchaseEntry.entry_date, PurchaseEntry.total_amount, PurchaseEntry.tenant_id, tenant_id
    )
    salary_by_month = await _sum_by_month(
        db, SalaryPayment.entry_date, SalaryPayment.amount, SalaryPayment.tenant_id, tenant_id
    )
    net_cash_by_month = await _sum_by_month(
        db, CashbookEntry.entry_date, CashbookEntry.amount, CashbookEntry.tenant_id, tenant_id
    )

    months = sorted(set(sales_by_month) | set(purchases_by_month) | set(salary_by_month) | set(net_cash_by_month))
    data = [
        [
            month,
            sales_by_month.get(month, Decimal("0")),
            purchases_by_month.get(month, Decimal("0")),
            salary_by_month.get(month, Decimal("0")),
            net_cash_by_month.get(month, Decimal("0")),
        ]
        for month in months
    ]
    return _csv_response(
        "monthly-summary",
        ["Month", "Total Sales", "Total Purchases", "Total Salary Paid", "Net Cash Flow"],
        data,
    )


async def _sum_by_month(db: AsyncSession, date_col, amount_col, tenant_col, tenant_id: uuid.UUID) -> dict[str, Decimal]:
    month_col = func.date_trunc("month", date_col)
    stmt = (
        select(month_col.label("month"), func.sum(amount_col))
        .where(tenant_col == tenant_id)
        .group_by(month_col)
    )
    rows = (await db.execute(stmt)).all()
    return {month.strftime("%Y-%m"): total for month, total in rows}
