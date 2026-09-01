import uuid

from pydantic import BaseModel, EmailStr, Field


class SignupRequest(BaseModel):
    firm_name: str = Field(..., min_length=1)
    admin_name: str = Field(..., min_length=1)
    email: EmailStr
    password: str = Field(..., min_length=8)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID | None
    name: str
    email: EmailStr
    role: str
    theme_preference: str

    model_config = {"from_attributes": True}
