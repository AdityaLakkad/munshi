import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field, model_validator

PaymentModeLiteral = Literal["cash", "bank", "upi"]


class CashbookEntryCreate(BaseModel):
    """Manual entries only — sales_payment/purchase_payment/salary/advance_salary
    are created indirectly via their own module endpoints (CLAUDE.md rule 7)."""

    entry_date: date
    type: Literal["credit", "debit"]
    amount: Decimal = Field(gt=0)
    mode: PaymentModeLiteral
    category: str | None = None
    remarks: str | None = None


class TransferCreate(BaseModel):
    entry_date: date
    from_mode: PaymentModeLiteral
    to_mode: PaymentModeLiteral
    amount: Decimal = Field(gt=0)
    remarks: str | None = None

    @model_validator(mode="after")
    def modes_must_differ(self) -> "TransferCreate":
        if self.from_mode == self.to_mode:
            raise ValueError("from_mode and to_mode must be different")
        return self


class CashbookEntryOut(BaseModel):
    id: uuid.UUID
    entry_date: date
    type: str
    amount: Decimal
    mode: str
    category: str | None
    linked_ref_type: str | None
    linked_ref_id: uuid.UUID | None
    remarks: str | None
    created_by: uuid.UUID
    created_at: datetime

    model_config = {"from_attributes": True}


class CashbookLedgerRow(CashbookEntryOut):
    running_balance: Decimal
