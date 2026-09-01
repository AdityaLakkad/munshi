import uuid

from pydantic import BaseModel, EmailStr


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
