import uuid
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class EmployeeCreate(BaseModel):
    name: str = Field(..., min_length=1)
    designation: str | None = None
    monthly_salary: Decimal = Decimal("0")
    joining_date: date | None = None
    status: str = "active"


class EmployeeUpdate(BaseModel):
    name: str | None = Field(None, min_length=1)
    designation: str | None = None
    monthly_salary: Decimal | None = None
    joining_date: date | None = None
    status: str | None = None


class EmployeeOut(BaseModel):
    id: uuid.UUID
    name: str
    designation: str | None
    monthly_salary: Decimal
    joining_date: date | None
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}
