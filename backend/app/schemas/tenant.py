import uuid

from pydantic import BaseModel, Field


class TenantOut(BaseModel):
    id: uuid.UUID
    name: str
    currency: str

    model_config = {"from_attributes": True}


class TenantUpdate(BaseModel):
    name: str | None = Field(None, min_length=1)
    currency: str | None = Field(None, min_length=3, max_length=3)
