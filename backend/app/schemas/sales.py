import uuid
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class SalesEntryCreate(BaseModel):
    entry_date: date
    customer_id: uuid.UUID
    item_desc: str | None = None
    qty: Decimal = Field(default=Decimal("1"), gt=0)
    rate: Decimal = Field(gt=0)


class SalesEntryOut(BaseModel):
    id: uuid.UUID
    entry_date: date
    customer_id: uuid.UUID
    customer_name: str
    item_desc: str | None
    qty: Decimal
    rate: Decimal
    total_amount: Decimal
    created_by: uuid.UUID
    created_at: datetime

    model_config = {"from_attributes": True}


class SalesPaymentCreate(BaseModel):
    entry_date: date
    customer_id: uuid.UUID
    sales_entry_id: uuid.UUID | None = None
    amount: Decimal = Field(gt=0)
    mode: str


class SalesPaymentOut(BaseModel):
    id: uuid.UUID
    entry_date: date
    customer_id: uuid.UUID
    customer_name: str
    sales_entry_id: uuid.UUID | None
    amount: Decimal
    mode: str
    created_by: uuid.UUID
    created_at: datetime

    model_config = {"from_attributes": True}


class CustomerOutstandingOut(BaseModel):
    customer_id: uuid.UUID
    customer_name: str
    total_sales: Decimal
    total_paid: Decimal
    outstanding: Decimal
