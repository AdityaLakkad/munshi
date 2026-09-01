import uuid
from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_tenant, get_current_user
from app.db.session import get_db
from app.models.cashbook import CashbookType, PaymentMode
from app.models.customer import Customer
from app.models.sales import SalesEntry, SalesPayment
from app.models.user import User
from app.schemas.common import PageResponse
from app.schemas.sales import (
    CustomerOutstandingOut,
    SalesEntryCreate,
    SalesEntryOut,
    SalesPaymentCreate,
    SalesPaymentOut,
)
from app.services.cashbook import create_cashbook_entry
from app.services.items import upsert_item

router = APIRouter()


async def _get_customer_or_404(customer_id: uuid.UUID, tenant_id: uuid.UUID, db: AsyncSession) -> Customer:
    result = await db.execute(
        select(Customer).where(Customer.id == customer_id, Customer.tenant_id == tenant_id)
    )
    customer = result.scalar_one_or_none()
    if customer is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
    return customer


_SALES_ENTRY_COLUMNS = (
    SalesEntry.id,
    SalesEntry.entry_date,
    SalesEntry.customer_id,
    Customer.name.label("customer_name"),
    SalesEntry.item_desc,
    SalesEntry.qty,
    SalesEntry.rate,
    SalesEntry.total_amount,
    SalesEntry.created_by,
    SalesEntry.created_at,
)


@router.get("/entries", response_model=PageResponse[SalesEntryOut])
async def list_sales_entries(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    from_: date | None = Query(None, alias="from"),
    to: date | None = None,
    customer_id: uuid.UUID | None = None,
    tenant_id: uuid.UUID = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
) -> PageResponse[SalesEntryOut]:
    stmt = (
        select(*_SALES_ENTRY_COLUMNS)
        .join(Customer, Customer.id == SalesEntry.customer_id)
        .where(SalesEntry.tenant_id == tenant_id)
    )
    if from_:
        stmt = stmt.where(SalesEntry.entry_date >= from_)
    if to:
        stmt = stmt.where(SalesEntry.entry_date <= to)
    if customer_id:
        stmt = stmt.where(SalesEntry.customer_id == customer_id)

    total = (await db.execute(select(func.count()).select_from(stmt.subquery()))).scalar_one()
    rows = (
        await db.execute(
            stmt.order_by(SalesEntry.entry_date.desc(), SalesEntry.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
    ).all()

    return PageResponse(
        items=[SalesEntryOut(**row._mapping) for row in rows], total=total, page=page, page_size=page_size
    )


@router.post("/entries", response_model=SalesEntryOut, status_code=status.HTTP_201_CREATED)
async def create_sales_entry(
    payload: SalesEntryCreate,
    tenant_id: uuid.UUID = Depends(get_current_tenant),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SalesEntryOut:
    customer = await _get_customer_or_404(payload.customer_id, tenant_id, db)
    if payload.item_desc:
        await upsert_item(db, tenant_id=tenant_id, name=payload.item_desc)

    entry = SalesEntry(
        tenant_id=tenant_id,
        entry_date=payload.entry_date,
        customer_id=payload.customer_id,
        item_desc=payload.item_desc,
        qty=payload.qty,
        rate=payload.rate,
        total_amount=payload.qty * payload.rate,
        created_by=user.id,
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return SalesEntryOut(
        id=entry.id,
        entry_date=entry.entry_date,
        customer_id=entry.customer_id,
        customer_name=customer.name,
        item_desc=entry.item_desc,
        qty=entry.qty,
        rate=entry.rate,
        total_amount=entry.total_amount,
        created_by=entry.created_by,
        created_at=entry.created_at,
    )


_SALES_PAYMENT_COLUMNS = (
    SalesPayment.id,
    SalesPayment.entry_date,
    SalesPayment.customer_id,
    Customer.name.label("customer_name"),
    SalesPayment.sales_entry_id,
    SalesPayment.amount,
    SalesPayment.mode,
    SalesPayment.created_by,
    SalesPayment.created_at,
)


@router.get("/payments", response_model=PageResponse[SalesPaymentOut])
async def list_sales_payments(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    from_: date | None = Query(None, alias="from"),
    to: date | None = None,
    customer_id: uuid.UUID | None = None,
    tenant_id: uuid.UUID = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
) -> PageResponse[SalesPaymentOut]:
    stmt = (
        select(*_SALES_PAYMENT_COLUMNS)
        .join(Customer, Customer.id == SalesPayment.customer_id)
        .where(SalesPayment.tenant_id == tenant_id)
    )
    if from_:
        stmt = stmt.where(SalesPayment.entry_date >= from_)
    if to:
        stmt = stmt.where(SalesPayment.entry_date <= to)
    if customer_id:
        stmt = stmt.where(SalesPayment.customer_id == customer_id)

    total = (await db.execute(select(func.count()).select_from(stmt.subquery()))).scalar_one()
    rows = (
        await db.execute(
            stmt.order_by(SalesPayment.entry_date.desc(), SalesPayment.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
    ).all()

    return PageResponse(
        items=[SalesPaymentOut(**row._mapping) for row in rows], total=total, page=page, page_size=page_size
    )


@router.post("/payments", response_model=SalesPaymentOut, status_code=status.HTTP_201_CREATED)
async def create_sales_payment(
    payload: SalesPaymentCreate,
    tenant_id: uuid.UUID = Depends(get_current_tenant),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SalesPaymentOut:
    customer = await _get_customer_or_404(payload.customer_id, tenant_id, db)
    if payload.sales_entry_id:
        result = await db.execute(
            select(SalesEntry).where(
                SalesEntry.id == payload.sales_entry_id, SalesEntry.tenant_id == tenant_id
            )
        )
        if result.scalar_one_or_none() is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sales entry not found")

    payment = SalesPayment(
        tenant_id=tenant_id,
        entry_date=payload.entry_date,
        customer_id=payload.customer_id,
        sales_entry_id=payload.sales_entry_id,
        amount=payload.amount,
        mode=PaymentMode(payload.mode),
        created_by=user.id,
    )
    db.add(payment)
    await db.flush()

    # Cashbook is the single source of truth for cash position (CLAUDE.md rule 7).
    await create_cashbook_entry(
        db,
        tenant_id=tenant_id,
        entry_date=payload.entry_date,
        type=CashbookType.sales_payment,
        amount=payload.amount,
        mode=PaymentMode(payload.mode),
        created_by=user.id,
        linked_ref_type="sales_payment",
        linked_ref_id=payment.id,
    )

    await db.commit()
    await db.refresh(payment)
    return SalesPaymentOut(
        id=payment.id,
        entry_date=payment.entry_date,
        customer_id=payment.customer_id,
        customer_name=customer.name,
        sales_entry_id=payment.sales_entry_id,
        amount=payment.amount,
        mode=payment.mode.value,
        created_by=payment.created_by,
        created_at=payment.created_at,
    )


@router.get("/outstanding", response_model=PageResponse[CustomerOutstandingOut])
async def customer_outstanding(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    tenant_id: uuid.UUID = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
) -> PageResponse[CustomerOutstandingOut]:
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
            Customer.id,
            Customer.name,
            func.coalesce(sales_totals.c.total_sales, 0).label("total_sales"),
            func.coalesce(payment_totals.c.total_paid, 0).label("total_paid"),
        )
        .select_from(Customer)
        .outerjoin(sales_totals, sales_totals.c.customer_id == Customer.id)
        .outerjoin(payment_totals, payment_totals.c.customer_id == Customer.id)
        .where(Customer.tenant_id == tenant_id)
        .where((sales_totals.c.total_sales.isnot(None)) | (payment_totals.c.total_paid.isnot(None)))
    )

    total = (await db.execute(select(func.count()).select_from(stmt.subquery()))).scalar_one()
    rows = (
        await db.execute(stmt.order_by(Customer.name).offset((page - 1) * page_size).limit(page_size))
    ).all()

    items = [
        CustomerOutstandingOut(
            customer_id=row.id,
            customer_name=row.name,
            total_sales=Decimal(row.total_sales),
            total_paid=Decimal(row.total_paid),
            outstanding=Decimal(row.total_sales) - Decimal(row.total_paid),
        )
        for row in rows
    ]
    return PageResponse(items=items, total=total, page=page, page_size=page_size)
