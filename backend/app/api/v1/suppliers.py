import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_tenant
from app.db.session import get_db
from app.models.supplier import Supplier
from app.schemas.common import PageResponse
from app.schemas.supplier import SupplierCreate, SupplierOut, SupplierUpdate

router = APIRouter()


@router.get("", response_model=PageResponse[SupplierOut])
async def list_suppliers(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    q: str | None = None,
    tenant_id: uuid.UUID = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
) -> PageResponse[SupplierOut]:
    stmt = select(Supplier).where(Supplier.tenant_id == tenant_id)
    if q:
        stmt = stmt.where(Supplier.name.ilike(f"%{q}%"))

    total = (await db.execute(select(func.count()).select_from(stmt.subquery()))).scalar_one()
    rows = (
        await db.execute(
            stmt.order_by(Supplier.name).offset((page - 1) * page_size).limit(page_size)
        )
    ).scalars().all()

    return PageResponse(
        items=[SupplierOut.model_validate(r) for r in rows], total=total, page=page, page_size=page_size
    )


@router.post("", response_model=SupplierOut, status_code=status.HTTP_201_CREATED)
async def create_supplier(
    payload: SupplierCreate,
    tenant_id: uuid.UUID = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
) -> SupplierOut:
    supplier = Supplier(tenant_id=tenant_id, **payload.model_dump())
    db.add(supplier)
    await db.commit()
    await db.refresh(supplier)
    return SupplierOut.model_validate(supplier)


async def _get_supplier_or_404(supplier_id: uuid.UUID, tenant_id: uuid.UUID, db: AsyncSession) -> Supplier:
    result = await db.execute(
        select(Supplier).where(Supplier.id == supplier_id, Supplier.tenant_id == tenant_id)
    )
    supplier = result.scalar_one_or_none()
    if supplier is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Supplier not found")
    return supplier


@router.get("/{supplier_id}", response_model=SupplierOut)
async def get_supplier(
    supplier_id: uuid.UUID,
    tenant_id: uuid.UUID = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
) -> SupplierOut:
    supplier = await _get_supplier_or_404(supplier_id, tenant_id, db)
    return SupplierOut.model_validate(supplier)


@router.patch("/{supplier_id}", response_model=SupplierOut)
async def update_supplier(
    supplier_id: uuid.UUID,
    payload: SupplierUpdate,
    tenant_id: uuid.UUID = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
) -> SupplierOut:
    supplier = await _get_supplier_or_404(supplier_id, tenant_id, db)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(supplier, field, value)
    await db.commit()
    await db.refresh(supplier)
    return SupplierOut.model_validate(supplier)
