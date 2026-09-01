import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_tenant
from app.db.session import get_db
from app.models.customer import Customer
from app.models.employee import Employee
from app.models.item import Item
from app.models.supplier import Supplier
from app.schemas.customer import CustomerOut
from app.schemas.employee import EmployeeOut
from app.schemas.item import ItemOut
from app.schemas.supplier import SupplierOut

router = APIRouter()

SEARCH_LIMIT = 10


@router.get("/customers", response_model=list[CustomerOut])
async def search_customers(
    q: str = Query("", min_length=0),
    tenant_id: uuid.UUID = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
) -> list[CustomerOut]:
    stmt = select(Customer).where(Customer.tenant_id == tenant_id)
    if q:
        stmt = stmt.where(Customer.name.ilike(f"%{q}%")).order_by(
            func.similarity(Customer.name, q).desc()
        )
    else:
        stmt = stmt.order_by(Customer.name)
    rows = (await db.execute(stmt.limit(SEARCH_LIMIT))).scalars().all()
    return [CustomerOut.model_validate(r) for r in rows]


@router.get("/suppliers", response_model=list[SupplierOut])
async def search_suppliers(
    q: str = Query("", min_length=0),
    tenant_id: uuid.UUID = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
) -> list[SupplierOut]:
    stmt = select(Supplier).where(Supplier.tenant_id == tenant_id)
    if q:
        stmt = stmt.where(Supplier.name.ilike(f"%{q}%")).order_by(
            func.similarity(Supplier.name, q).desc()
        )
    else:
        stmt = stmt.order_by(Supplier.name)
    rows = (await db.execute(stmt.limit(SEARCH_LIMIT))).scalars().all()
    return [SupplierOut.model_validate(r) for r in rows]


@router.get("/employees", response_model=list[EmployeeOut])
async def search_employees(
    q: str = Query("", min_length=0),
    tenant_id: uuid.UUID = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
) -> list[EmployeeOut]:
    stmt = select(Employee).where(Employee.tenant_id == tenant_id, Employee.status == "active")
    if q:
        stmt = stmt.where(Employee.name.ilike(f"%{q}%")).order_by(
            func.similarity(Employee.name, q).desc()
        )
    else:
        stmt = stmt.order_by(Employee.name)
    rows = (await db.execute(stmt.limit(SEARCH_LIMIT))).scalars().all()
    return [EmployeeOut.model_validate(r) for r in rows]


@router.get("/items", response_model=list[ItemOut])
async def search_items(
    q: str = Query("", min_length=0),
    tenant_id: uuid.UUID = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
) -> list[ItemOut]:
    stmt = select(Item).where(Item.tenant_id == tenant_id)
    if q:
        stmt = stmt.where(Item.name.ilike(f"%{q}%")).order_by(func.similarity(Item.name, q).desc())
    else:
        stmt = stmt.order_by(Item.name)
    rows = (await db.execute(stmt.limit(SEARCH_LIMIT))).scalars().all()
    return [ItemOut.model_validate(r) for r in rows]
