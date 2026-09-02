import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field


class MeOut(BaseModel):
    id: uuid.UUID
    name: str
    email: EmailStr
    role: str
    theme_preference: str
    tenant_id: uuid.UUID | None
    tenant_name: str | None
    tenant_slug: str | None
    tenant_currency: str | None


class UserListOut(BaseModel):
    id: uuid.UUID
    name: str
    email: EmailStr
    role: str
    created_at: datetime

    model_config = {"from_attributes": True}


class UserCreate(BaseModel):
    name: str = Field(..., min_length=1)
    email: EmailStr
    password: str = Field(..., min_length=8)
    role: Literal["staff", "viewer"]


class UserUpdate(BaseModel):
    name: str | None = Field(None, min_length=1)
    role: Literal["firm_admin", "staff", "viewer"] | None = None


class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)
