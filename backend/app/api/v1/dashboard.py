import uuid
from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_tenant
from app.db.session import get_db
from app.models.cashbook import CashbookEntry, PaymentMode
from app.models.purchases import PurchaseEntry, PurchasePayment
from app.models.sales import SalesEntry, SalesPayment
from app.schemas.cashbook import CashbookEntryOut
from app.schemas.dashboard import DashboardSummary

router = APIRouter()

RECENT_TRANSACTIONS_LIMIT = 15


async def _sum(db: AsyncSession, stmt) -> Decimal:
    result = await db.scalar(stmt)
    return result if result is not None else Decimal("0")


@router.get("", response_model=DashboardSummary)
async def get_dashboard(
    tenant_id: uuid.UUID = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
) -> DashboardSummary:
    month_start = date.today().replace(day=1)

    cash_in_hand = await _sum(
        db,
        select(func.sum(CashbookEntry.amount)).where(
            CashbookEntry.tenant_id == tenant_id, CashbookEntry.mode == PaymentMode.cash
        ),
    )
    bank_balance = await _sum(
        db,
        select(func.sum(CashbookEntry.amount)).where(
            CashbookEntry.tenant_id == tenant_id,
            CashbookEntry.mode.in_([PaymentMode.bank, PaymentMode.upi]),
        ),
    )

    total_sales_this_month = await _sum(
        db,
        select(func.sum(SalesEntry.total_amount)).where(
            SalesEntry.tenant_id == tenant_id, SalesEntry.entry_date >= month_start
        ),
    )
    total_purchases_this_month = await _sum(
        db,
        select(func.sum(PurchaseEntry.total_amount)).where(
            PurchaseEntry.tenant_id == tenant_id, PurchaseEntry.entry_date >= month_start
        ),
    )

    total_sales_all = await _sum(
        db, select(func.sum(SalesEntry.total_amount)).where(SalesEntry.tenant_id == tenant_id)
    )
    total_sales_payments_all = await _sum(
        db, select(func.sum(SalesPayment.amount)).where(SalesPayment.tenant_id == tenant_id)
    )
    total_purchases_all = await _sum(
        db, select(func.sum(PurchaseEntry.total_amount)).where(PurchaseEntry.tenant_id == tenant_id)
    )
    total_purchase_payments_all = await _sum(
        db, select(func.sum(PurchasePayment.amount)).where(PurchasePayment.tenant_id == tenant_id)
    )

    recent_rows = (
        await db.execute(
            select(CashbookEntry)
            .where(CashbookEntry.tenant_id == tenant_id)
            .order_by(CashbookEntry.created_at.desc())
            .limit(RECENT_TRANSACTIONS_LIMIT)
        )
    ).scalars().all()

    return DashboardSummary(
        cash_in_hand=cash_in_hand,
        bank_balance=bank_balance,
        total_sales_this_month=total_sales_this_month,
        total_purchases_this_month=total_purchases_this_month,
        total_receivable=total_sales_all - total_sales_payments_all,
        total_payable=total_purchases_all - total_purchase_payments_all,
        recent_transactions=[CashbookEntryOut.model_validate(r) for r in recent_rows],
    )
