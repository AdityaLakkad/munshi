import uuid
from datetime import date
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.cashbook import CashbookEntry, CashbookType, PaymentMode


async def create_cashbook_entry(
    db: AsyncSession,
    *,
    tenant_id: uuid.UUID,
    entry_date: date,
    type: CashbookType,
    amount: Decimal,
    mode: PaymentMode,
    created_by: uuid.UUID,
    category: str | None = None,
    remarks: str | None = None,
    linked_ref_type: str | None = None,
    linked_ref_id: uuid.UUID | None = None,
) -> CashbookEntry:
    """
    Cashbook is the single source of truth for cash position (CLAUDE.md rule 7).
    `amount` must already be signed: positive = cash inflow, negative = cash outflow.
    Every sales/purchase payment, salary, and advance salary MUST route through
    this helper so a linked cashbook_entries row always exists.
    """
    entry = CashbookEntry(
        tenant_id=tenant_id,
        entry_date=entry_date,
        type=type,
        amount=amount,
        mode=mode,
        category=category,
        linked_ref_type=linked_ref_type,
        linked_ref_id=linked_ref_id,
        remarks=remarks,
        created_by=created_by,
    )
    db.add(entry)
    await db.flush()
    await db.refresh(entry)
    return entry
