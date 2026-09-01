import uuid
from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_tenant, get_current_user
from app.db.session import get_db
from app.models.cashbook import CashbookEntry, CashbookType, PaymentMode
from app.models.user import User
from app.schemas.cashbook import CashbookEntryCreate, CashbookEntryOut, CashbookLedgerRow, TransferCreate
from app.schemas.common import PageResponse
from app.services.cashbook import create_cashbook_entry

router = APIRouter()

_LEDGER_COLUMNS = (
    CashbookEntry.id,
    CashbookEntry.entry_date,
    CashbookEntry.type,
    CashbookEntry.amount,
    CashbookEntry.mode,
    CashbookEntry.category,
    CashbookEntry.linked_ref_type,
    CashbookEntry.linked_ref_id,
    CashbookEntry.remarks,
    CashbookEntry.created_by,
    CashbookEntry.created_at,
)


@router.get("", response_model=PageResponse[CashbookLedgerRow])
async def list_cashbook(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    from_: date | None = Query(None, alias="from"),
    to: date | None = None,
    type: CashbookType | None = None,
    mode: PaymentMode | None = None,
    tenant_id: uuid.UUID = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
) -> PageResponse[CashbookLedgerRow]:
    # Running balance always reflects the true cash position across full tenant
    # history; from/to/type/mode only restrict which rows are *displayed*.
    running_balance_col = func.sum(CashbookEntry.amount).over(
        order_by=(CashbookEntry.entry_date, CashbookEntry.created_at, CashbookEntry.id)
    ).label("running_balance")

    base = (
        select(*_LEDGER_COLUMNS, running_balance_col)
        .where(CashbookEntry.tenant_id == tenant_id)
        .subquery()
    )

    stmt = select(base)
    if from_:
        stmt = stmt.where(base.c.entry_date >= from_)
    if to:
        stmt = stmt.where(base.c.entry_date <= to)
    if type:
        stmt = stmt.where(base.c.type == type)
    if mode:
        stmt = stmt.where(base.c.mode == mode)

    total = (await db.execute(select(func.count()).select_from(stmt.subquery()))).scalar_one()
    rows = (
        await db.execute(
            stmt.order_by(base.c.entry_date, base.c.created_at, base.c.id)
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
    ).all()

    items = [CashbookLedgerRow(**row._mapping) for row in rows]
    return PageResponse(items=items, total=total, page=page, page_size=page_size)


@router.post("", response_model=CashbookEntryOut, status_code=status.HTTP_201_CREATED)
async def create_entry(
    payload: CashbookEntryCreate,
    tenant_id: uuid.UUID = Depends(get_current_tenant),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CashbookEntryOut:
    direction = Decimal(1) if payload.type == "credit" else Decimal(-1)
    entry = await create_cashbook_entry(
        db,
        tenant_id=tenant_id,
        entry_date=payload.entry_date,
        type=CashbookType(payload.type),
        amount=payload.amount * direction,
        mode=PaymentMode(payload.mode),
        created_by=user.id,
        category=payload.category,
        remarks=payload.remarks,
    )
    await db.commit()
    await db.refresh(entry)
    return CashbookEntryOut.model_validate(entry)


@router.post("/transfer", response_model=list[CashbookEntryOut], status_code=status.HTTP_201_CREATED)
async def create_transfer(
    payload: TransferCreate,
    tenant_id: uuid.UUID = Depends(get_current_tenant),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[CashbookEntryOut]:
    transfer_id = uuid.uuid4()

    out_entry = await create_cashbook_entry(
        db,
        tenant_id=tenant_id,
        entry_date=payload.entry_date,
        type=CashbookType.transfer,
        amount=-payload.amount,
        mode=PaymentMode(payload.from_mode),
        created_by=user.id,
        remarks=payload.remarks,
        linked_ref_type="transfer",
        linked_ref_id=transfer_id,
    )
    in_entry = await create_cashbook_entry(
        db,
        tenant_id=tenant_id,
        entry_date=payload.entry_date,
        type=CashbookType.transfer,
        amount=payload.amount,
        mode=PaymentMode(payload.to_mode),
        created_by=user.id,
        remarks=payload.remarks,
        linked_ref_type="transfer",
        linked_ref_id=transfer_id,
    )
    await db.commit()
    await db.refresh(out_entry)
    await db.refresh(in_entry)
    return [CashbookEntryOut.model_validate(out_entry), CashbookEntryOut.model_validate(in_entry)]
