import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_tenant, get_current_user, require_firm_admin
from app.core.security import hash_password, verify_password
from app.db.session import get_db
from app.models.tenant import Tenant
from app.models.user import User, UserRole
from app.schemas.common import PageResponse
from app.schemas.user import MeOut, PasswordChange, UserCreate, UserListOut, UserUpdate

router = APIRouter()


@router.get("/me", response_model=MeOut)
async def read_me(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MeOut:
    tenant: Tenant | None = None
    if user.tenant_id is not None:
        result = await db.execute(select(Tenant).where(Tenant.id == user.tenant_id))
        tenant = result.scalar_one_or_none()

    return MeOut(
        id=user.id,
        name=user.name,
        email=user.email,
        role=user.role.value,
        theme_preference=user.theme_preference,
        tenant_id=user.tenant_id,
        tenant_name=tenant.name if tenant else None,
        tenant_slug=tenant.slug if tenant else None,
        tenant_currency=tenant.currency if tenant else None,
    )


@router.patch("/me/password", status_code=status.HTTP_204_NO_CONTENT)
async def change_my_password(
    payload: PasswordChange,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    if not verify_password(payload.current_password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")
    user.password_hash = hash_password(payload.new_password)
    await db.commit()


async def _count_firm_admins(tenant_id: uuid.UUID, db: AsyncSession) -> int:
    result = await db.execute(
        select(func.count()).select_from(User).where(User.tenant_id == tenant_id, User.role == UserRole.firm_admin)
    )
    return result.scalar_one()


@router.get("", response_model=PageResponse[UserListOut])
async def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    tenant_id: uuid.UUID = Depends(get_current_tenant),
    _admin: User = Depends(require_firm_admin),
    db: AsyncSession = Depends(get_db),
) -> PageResponse[UserListOut]:
    stmt = select(User).where(User.tenant_id == tenant_id)

    total = (await db.execute(select(func.count()).select_from(stmt.subquery()))).scalar_one()
    rows = (
        await db.execute(stmt.order_by(User.name).offset((page - 1) * page_size).limit(page_size))
    ).scalars().all()

    return PageResponse(
        items=[UserListOut.model_validate(r) for r in rows], total=total, page=page, page_size=page_size
    )


@router.post("", response_model=UserListOut, status_code=status.HTTP_201_CREATED)
async def create_user(
    payload: UserCreate,
    tenant_id: uuid.UUID = Depends(get_current_tenant),
    _admin: User = Depends(require_firm_admin),
    db: AsyncSession = Depends(get_db),
) -> UserListOut:
    existing = await db.execute(select(User).where(User.email == payload.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    user = User(
        tenant_id=tenant_id,
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=UserRole(payload.role),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return UserListOut.model_validate(user)


async def _get_tenant_user_or_404(user_id: uuid.UUID, tenant_id: uuid.UUID, db: AsyncSession) -> User:
    result = await db.execute(select(User).where(User.id == user_id, User.tenant_id == tenant_id))
    target = result.scalar_one_or_none()
    if target is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return target


@router.patch("/{user_id}", response_model=UserListOut)
async def update_user(
    user_id: uuid.UUID,
    payload: UserUpdate,
    tenant_id: uuid.UUID = Depends(get_current_tenant),
    admin: User = Depends(require_firm_admin),
    db: AsyncSession = Depends(get_db),
) -> UserListOut:
    target = await _get_tenant_user_or_404(user_id, tenant_id, db)

    if payload.role and UserRole(payload.role) != target.role and target.role == UserRole.firm_admin:
        if await _count_firm_admins(tenant_id, db) <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot demote the only Firm Admin"
            )

    if payload.name is not None:
        target.name = payload.name
    if payload.role is not None:
        target.role = UserRole(payload.role)

    await db.commit()
    await db.refresh(target)
    return UserListOut.model_validate(target)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: uuid.UUID,
    tenant_id: uuid.UUID = Depends(get_current_tenant),
    admin: User = Depends(require_firm_admin),
    db: AsyncSession = Depends(get_db),
) -> None:
    if user_id == admin.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot remove your own account")

    target = await _get_tenant_user_or_404(user_id, tenant_id, db)
    if target.role == UserRole.firm_admin and await _count_firm_admins(tenant_id, db) <= 1:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot remove the only Firm Admin")

    await db.delete(target)
    await db.commit()
