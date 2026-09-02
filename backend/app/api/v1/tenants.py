import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_tenant, require_firm_admin
from app.db.session import get_db
from app.models.tenant import Tenant
from app.models.user import User
from app.schemas.tenant import TenantOut, TenantUpdate

router = APIRouter()


@router.get("/me", response_model=TenantOut)
async def get_my_tenant(
    tenant_id: uuid.UUID = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
) -> TenantOut:
    tenant = await db.get(Tenant, tenant_id)
    return TenantOut.model_validate(tenant)


@router.patch("/me", response_model=TenantOut)
async def update_my_tenant(
    payload: TenantUpdate,
    admin: User = Depends(require_firm_admin),
    db: AsyncSession = Depends(get_db),
) -> TenantOut:
    tenant = await db.get(Tenant, admin.tenant_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(tenant, field, value)
    await db.commit()
    await db.refresh(tenant)
    return TenantOut.model_validate(tenant)
