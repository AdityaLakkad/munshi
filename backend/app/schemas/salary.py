import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field


class SalaryPaymentCreate(BaseModel):
    entry_date: date
    employee_id: uuid.UUID
    period_month: date
    amount: Decimal = Field(gt=0)
    mode: str


class SalaryPaymentOut(BaseModel):
    id: uuid.UUID
    entry_date: date
    employee_id: uuid.UUID
    employee_name: str
    period_month: date
    amount: Decimal
    mode: str
    created_by: uuid.UUID
    created_at: datetime

    model_config = {"from_attributes": True}


class AdvanceSalaryCreate(BaseModel):
    entry_date: date
    employee_id: uuid.UUID
    amount: Decimal = Field(gt=0)


class AdvanceSalaryUpdate(BaseModel):
    adjusted_status: Literal["pending", "adjusted"]


class AdvanceSalaryOut(BaseModel):
    id: uuid.UUID
    entry_date: date
    employee_id: uuid.UUID
    employee_name: str
    amount: Decimal
    adjusted_status: str
    created_by: uuid.UUID
    created_at: datetime

    model_config = {"from_attributes": True}


class EmployeeLedgerEntry(BaseModel):
    id: uuid.UUID
    entry_date: date
    type: Literal["salary", "advance_salary"]
    amount: Decimal
    period_month: date | None = None
    adjusted_status: str | None = None


class EmployeeLedgerOut(BaseModel):
    employee_id: uuid.UUID
    employee_name: str
    total_salary_paid: Decimal
    total_advances_given: Decimal
    total_advances_adjusted: Decimal
    advances_outstanding: Decimal
    entries: list[EmployeeLedgerEntry]
