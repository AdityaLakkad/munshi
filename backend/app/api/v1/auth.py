"""
Signup creates a new Tenant + its first firm_admin User in one transaction.
Login returns a JWT access + refresh token pair.

This is Milestone 2 (Auth & Tenancy) in SPECIFICATION.md §8 — implemented
here as a working starting point; extend with refresh-token rotation,
email verification, invite-flow for staff/viewer users, etc. as needed.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
)
from app.db.session import get_db
from app.models.tenant import Tenant
from app.models.user import User, UserRole
from app.schemas.auth import LoginRequest, SignupRequest, TokenResponse

router = APIRouter()


def slugify(name: str) -> str:
    return "-".join(name.strip().lower().split())


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def signup(payload: SignupRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    existing = await db.execute(select(User).where(User.email == payload.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    tenant = Tenant(name=payload.firm_name, slug=slugify(payload.firm_name))
    db.add(tenant)
    await db.flush()  # get tenant.id before creating the user

    user = User(
        tenant_id=tenant.id,
        name=payload.admin_name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=UserRole.firm_admin,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    return TokenResponse(
        access_token=create_access_token(user.id, user.tenant_id, user.role.value),
        refresh_token=create_refresh_token(user.id),
    )


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    return TokenResponse(
        access_token=create_access_token(user.id, user.tenant_id, user.role.value),
        refresh_token=create_refresh_token(user.id),
    )
