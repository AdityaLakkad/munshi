import uuid
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class PurchaseEntryCreate(BaseModel):
    entry_date: date
    supplier_id: uuid.UUID
    item_desc: str | None = None
    qty: Decimal = Field(default=Decimal("1"), gt=0)
    rate: Decimal = Field(gt=0)


class PurchaseEntryOut(BaseModel):
    id: uuid.UUID
    entry_date: date
    supplier_id: uuid.UUID
    supplier_name: str
    item_desc: str | None
    qty: Decimal
    rate: Decimal
    total_amount: Decimal
    created_by: uuid.UUID
    created_at: datetime

    model_config = {"from_attributes": True}


class PurchasePaymentCreate(BaseModel):
    entry_date: date
    supplier_id: uuid.UUID
    purchase_entry_id: uuid.UUID | None = None
    amount: Decimal = Field(gt=0)
    mode: str


class PurchasePaymentOut(BaseModel):
    id: uuid.UUID
    entry_date: date
    supplier_id: uuid.UUID
    supplier_name: str
    purchase_entry_id: uuid.UUID | None
    amount: Decimal
    mode: str
    created_by: uuid.UUID
    created_at: datetime

    model_config = {"from_attributes": True}


class SupplierOutstandingOut(BaseModel):
    supplier_id: uuid.UUID
    supplier_name: str
    total_purchases: Decimal
    total_paid: Decimal
    outstanding: Decimal
