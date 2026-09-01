from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.tenant import Tenant
from app.models.user import User
from app.schemas.user import MeOut

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
