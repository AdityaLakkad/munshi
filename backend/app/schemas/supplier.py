import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class SupplierCreate(BaseModel):
    name: str = Field(..., min_length=1)
    phone: str | None = None
    address: str | None = None


class SupplierUpdate(BaseModel):
    name: str | None = Field(None, min_length=1)
    phone: str | None = None
    address: str | None = None


class SupplierOut(BaseModel):
    id: uuid.UUID
    name: str
    phone: str | None
    address: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
