import uuid
from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_tenant, get_current_user
from app.db.session import get_db
from app.models.cashbook import CashbookType, PaymentMode
from app.models.purchases import PurchaseEntry, PurchasePayment
from app.models.supplier import Supplier
from app.models.user import User
from app.schemas.common import PageResponse
from app.schemas.purchases import (
    PurchaseEntryCreate,
    PurchaseEntryOut,
    PurchasePaymentCreate,
    PurchasePaymentOut,
    SupplierOutstandingOut,
)
from app.services.cashbook import create_cashbook_entry
from app.services.items import upsert_item

router = APIRouter()


async def _get_supplier_or_404(supplier_id: uuid.UUID, tenant_id: uuid.UUID, db: AsyncSession) -> Supplier:
    result = await db.execute(
        select(Supplier).where(Supplier.id == supplier_id, Supplier.tenant_id == tenant_id)
    )
    supplier = result.scalar_one_or_none()
    if supplier is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Supplier not found")
    return supplier


_PURCHASE_ENTRY_COLUMNS = (
    PurchaseEntry.id,
    PurchaseEntry.entry_date,
    PurchaseEntry.supplier_id,
    Supplier.name.label("supplier_name"),
    PurchaseEntry.item_desc,
    PurchaseEntry.qty,
    PurchaseEntry.rate,
    PurchaseEntry.total_amount,
    PurchaseEntry.created_by,
    PurchaseEntry.created_at,
)


@router.get("/entries", response_model=PageResponse[PurchaseEntryOut])
async def list_purchase_entries(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    from_: date | None = Query(None, alias="from"),
    to: date | None = None,
    supplier_id: uuid.UUID | None = None,
    tenant_id: uuid.UUID = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
) -> PageResponse[PurchaseEntryOut]:
    stmt = (
        select(*_PURCHASE_ENTRY_COLUMNS)
        .join(Supplier, Supplier.id == PurchaseEntry.supplier_id)
        .where(PurchaseEntry.tenant_id == tenant_id)
    )
    if from_:
        stmt = stmt.where(PurchaseEntry.entry_date >= from_)
    if to:
        stmt = stmt.where(PurchaseEntry.entry_date <= to)
    if supplier_id:
        stmt = stmt.where(PurchaseEntry.supplier_id == supplier_id)

    total = (await db.execute(select(func.count()).select_from(stmt.subquery()))).scalar_one()
    rows = (
        await db.execute(
            stmt.order_by(PurchaseEntry.entry_date.desc(), PurchaseEntry.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
    ).all()

    return PageResponse(
        items=[PurchaseEntryOut(**row._mapping) for row in rows], total=total, page=page, page_size=page_size
    )


@router.post("/entries", response_model=PurchaseEntryOut, status_code=status.HTTP_201_CREATED)
async def create_purchase_entry(
    payload: PurchaseEntryCreate,
    tenant_id: uuid.UUID = Depends(get_current_tenant),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PurchaseEntryOut:
    supplier = await _get_supplier_or_404(payload.supplier_id, tenant_id, db)
    if payload.item_desc:
        await upsert_item(db, tenant_id=tenant_id, name=payload.item_desc)

    entry = PurchaseEntry(
        tenant_id=tenant_id,
        entry_date=payload.entry_date,
        supplier_id=payload.supplier_id,
        item_desc=payload.item_desc,
        qty=payload.qty,
        rate=payload.rate,
        total_amount=payload.qty * payload.rate,
        created_by=user.id,
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return PurchaseEntryOut(
        id=entry.id,
        entry_date=entry.entry_date,
        supplier_id=entry.supplier_id,
        supplier_name=supplier.name,
        item_desc=entry.item_desc,
        qty=entry.qty,
        rate=entry.rate,
        total_amount=entry.total_amount,
        created_by=entry.created_by,
        created_at=entry.created_at,
    )


_PURCHASE_PAYMENT_COLUMNS = (
    PurchasePayment.id,
    PurchasePayment.entry_date,
    PurchasePayment.supplier_id,
    Supplier.name.label("supplier_name"),
    PurchasePayment.purchase_entry_id,
    PurchasePayment.amount,
    PurchasePayment.mode,
    PurchasePayment.created_by,
    PurchasePayment.created_at,
)


@router.get("/payments", response_model=PageResponse[PurchasePaymentOut])
async def list_purchase_payments(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    from_: date | None = Query(None, alias="from"),
    to: date | None = None,
    supplier_id: uuid.UUID | None = None,
    tenant_id: uuid.UUID = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
) -> PageResponse[PurchasePaymentOut]:
    stmt = (
        select(*_PURCHASE_PAYMENT_COLUMNS)
        .join(Supplier, Supplier.id == PurchasePayment.supplier_id)
        .where(PurchasePayment.tenant_id == tenant_id)
    )
    if from_:
        stmt = stmt.where(PurchasePayment.entry_date >= from_)
    if to:
        stmt = stmt.where(PurchasePayment.entry_date <= to)
    if supplier_id:
        stmt = stmt.where(PurchasePayment.supplier_id == supplier_id)

    total = (await db.execute(select(func.count()).select_from(stmt.subquery()))).scalar_one()
    rows = (
        await db.execute(
            stmt.order_by(PurchasePayment.entry_date.desc(), PurchasePayment.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
    ).all()

    return PageResponse(
        items=[PurchasePaymentOut(**row._mapping) for row in rows], total=total, page=page, page_size=page_size
    )


@router.post("/payments", response_model=PurchasePaymentOut, status_code=status.HTTP_201_CREATED)
async def create_purchase_payment(
    payload: PurchasePaymentCreate,
    tenant_id: uuid.UUID = Depends(get_current_tenant),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PurchasePaymentOut:
    supplier = await _get_supplier_or_404(payload.supplier_id, tenant_id, db)
    if payload.purchase_entry_id:
        result = await db.execute(
            select(PurchaseEntry).where(
                PurchaseEntry.id == payload.purchase_entry_id, PurchaseEntry.tenant_id == tenant_id
            )
        )
        if result.scalar_one_or_none() is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Purchase entry not found")

    payment = PurchasePayment(
        tenant_id=tenant_id,
        entry_date=payload.entry_date,
        supplier_id=payload.supplier_id,
        purchase_entry_id=payload.purchase_entry_id,
        amount=payload.amount,
        mode=PaymentMode(payload.mode),
        created_by=user.id,
    )
    db.add(payment)
    await db.flush()

    # Cashbook is the single source of truth for cash position (CLAUDE.md rule 7).
    # Paying a supplier is a cash outflow, so it's stored signed-negative.
    await create_cashbook_entry(
        db,
        tenant_id=tenant_id,
        entry_date=payload.entry_date,
        type=CashbookType.purchase_payment,
        amount=-payload.amount,
        mode=PaymentMode(payload.mode),
        created_by=user.id,
        linked_ref_type="purchase_payment",
        linked_ref_id=payment.id,
    )

    await db.commit()
    await db.refresh(payment)
    return PurchasePaymentOut(
        id=payment.id,
        entry_date=payment.entry_date,
        supplier_id=payment.supplier_id,
        supplier_name=supplier.name,
        purchase_entry_id=payment.purchase_entry_id,
        amount=payment.amount,
        mode=payment.mode.value,
        created_by=payment.created_by,
        created_at=payment.created_at,
    )


@router.get("/outstanding", response_model=PageResponse[SupplierOutstandingOut])
async def supplier_outstanding(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    tenant_id: uuid.UUID = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
) -> PageResponse[SupplierOutstandingOut]:
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
            Supplier.id,
            Supplier.name,
            func.coalesce(purchase_totals.c.total_purchases, 0).label("total_purchases"),
            func.coalesce(payment_totals.c.total_paid, 0).label("total_paid"),
        )
        .select_from(Supplier)
        .outerjoin(purchase_totals, purchase_totals.c.supplier_id == Supplier.id)
        .outerjoin(payment_totals, payment_totals.c.supplier_id == Supplier.id)
        .where(Supplier.tenant_id == tenant_id)
        .where((purchase_totals.c.total_purchases.isnot(None)) | (payment_totals.c.total_paid.isnot(None)))
    )

    total = (await db.execute(select(func.count()).select_from(stmt.subquery()))).scalar_one()
    rows = (
        await db.execute(stmt.order_by(Supplier.name).offset((page - 1) * page_size).limit(page_size))
    ).all()

    items = [
        SupplierOutstandingOut(
            supplier_id=row.id,
            supplier_name=row.name,
            total_purchases=Decimal(row.total_purchases),
            total_paid=Decimal(row.total_paid),
            outstanding=Decimal(row.total_purchases) - Decimal(row.total_paid),
        )
        for row in rows
    ]
    return PageResponse(items=items, total=total, page=page, page_size=page_size)
