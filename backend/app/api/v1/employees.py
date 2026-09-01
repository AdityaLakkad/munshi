import uuid
from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_tenant, get_current_user
from app.db.session import get_db
from app.models.cashbook import CashbookType, PaymentMode
from app.models.employee import Employee
from app.models.salary import AdvanceSalary, SalaryPayment
from app.models.user import User
from app.schemas.common import PageResponse
from app.schemas.employee import EmployeeCreate, EmployeeOut, EmployeeUpdate
from app.schemas.salary import (
    AdvanceSalaryCreate,
    AdvanceSalaryOut,
    AdvanceSalaryUpdate,
    EmployeeLedgerEntry,
    EmployeeLedgerOut,
    SalaryPaymentCreate,
    SalaryPaymentOut,
)
from app.services.cashbook import create_cashbook_entry

router = APIRouter()


async def _get_employee_or_404(employee_id: uuid.UUID, tenant_id: uuid.UUID, db: AsyncSession) -> Employee:
    result = await db.execute(
        select(Employee).where(Employee.id == employee_id, Employee.tenant_id == tenant_id)
    )
    employee = result.scalar_one_or_none()
    if employee is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    return employee


@router.get("", response_model=PageResponse[EmployeeOut])
async def list_employees(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    q: str | None = None,
    tenant_id: uuid.UUID = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
) -> PageResponse[EmployeeOut]:
    stmt = select(Employee).where(Employee.tenant_id == tenant_id)
    if q:
        stmt = stmt.where(Employee.name.ilike(f"%{q}%"))

    total = (await db.execute(select(func.count()).select_from(stmt.subquery()))).scalar_one()
    rows = (
        await db.execute(
            stmt.order_by(Employee.name).offset((page - 1) * page_size).limit(page_size)
        )
    ).scalars().all()

    return PageResponse(
        items=[EmployeeOut.model_validate(r) for r in rows], total=total, page=page, page_size=page_size
    )


@router.post("", response_model=EmployeeOut, status_code=status.HTTP_201_CREATED)
async def create_employee(
    payload: EmployeeCreate,
    tenant_id: uuid.UUID = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
) -> EmployeeOut:
    employee = Employee(tenant_id=tenant_id, **payload.model_dump())
    db.add(employee)
    await db.commit()
    await db.refresh(employee)
    return EmployeeOut.model_validate(employee)


# --- Salary & advance salary (Milestone 8) -------------------------------
# Registered before the generic /{employee_id} routes below so "salary" and
# "advance" aren't swallowed as a path parameter.

_SALARY_COLUMNS = (
    SalaryPayment.id,
    SalaryPayment.entry_date,
    SalaryPayment.employee_id,
    Employee.name.label("employee_name"),
    SalaryPayment.period_month,
    SalaryPayment.amount,
    SalaryPayment.mode,
    SalaryPayment.created_by,
    SalaryPayment.created_at,
)


@router.get("/salary", response_model=PageResponse[SalaryPaymentOut])
async def list_salary_payments(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    from_: date | None = Query(None, alias="from"),
    to: date | None = None,
    employee_id: uuid.UUID | None = None,
    tenant_id: uuid.UUID = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
) -> PageResponse[SalaryPaymentOut]:
    stmt = (
        select(*_SALARY_COLUMNS)
        .join(Employee, Employee.id == SalaryPayment.employee_id)
        .where(SalaryPayment.tenant_id == tenant_id)
    )
    if from_:
        stmt = stmt.where(SalaryPayment.entry_date >= from_)
    if to:
        stmt = stmt.where(SalaryPayment.entry_date <= to)
    if employee_id:
        stmt = stmt.where(SalaryPayment.employee_id == employee_id)

    total = (await db.execute(select(func.count()).select_from(stmt.subquery()))).scalar_one()
    rows = (
        await db.execute(
            stmt.order_by(SalaryPayment.entry_date.desc(), SalaryPayment.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
    ).all()

    return PageResponse(
        items=[SalaryPaymentOut(**row._mapping) for row in rows], total=total, page=page, page_size=page_size
    )


@router.post("/salary", response_model=SalaryPaymentOut, status_code=status.HTTP_201_CREATED)
async def create_salary_payment(
    payload: SalaryPaymentCreate,
    tenant_id: uuid.UUID = Depends(get_current_tenant),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SalaryPaymentOut:
    employee = await _get_employee_or_404(payload.employee_id, tenant_id, db)

    payment = SalaryPayment(
        tenant_id=tenant_id,
        entry_date=payload.entry_date,
        employee_id=payload.employee_id,
        period_month=payload.period_month.replace(day=1),
        amount=payload.amount,
        mode=PaymentMode(payload.mode),
        created_by=user.id,
    )
    db.add(payment)
    await db.flush()

    # Cashbook is the single source of truth for cash position (CLAUDE.md rule 7).
    await create_cashbook_entry(
        db,
        tenant_id=tenant_id,
        entry_date=payload.entry_date,
        type=CashbookType.salary,
        amount=-payload.amount,
        mode=PaymentMode(payload.mode),
        created_by=user.id,
        linked_ref_type="salary_payment",
        linked_ref_id=payment.id,
    )

    await db.commit()
    await db.refresh(payment)
    return SalaryPaymentOut(
        id=payment.id,
        entry_date=payment.entry_date,
        employee_id=payment.employee_id,
        employee_name=employee.name,
        period_month=payment.period_month,
        amount=payment.amount,
        mode=payment.mode.value,
        created_by=payment.created_by,
        created_at=payment.created_at,
    )


_ADVANCE_COLUMNS = (
    AdvanceSalary.id,
    AdvanceSalary.entry_date,
    AdvanceSalary.employee_id,
    Employee.name.label("employee_name"),
    AdvanceSalary.amount,
    AdvanceSalary.adjusted_status,
    AdvanceSalary.created_by,
    AdvanceSalary.created_at,
)


@router.get("/advance", response_model=PageResponse[AdvanceSalaryOut])
async def list_advance_salaries(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    from_: date | None = Query(None, alias="from"),
    to: date | None = None,
    employee_id: uuid.UUID | None = None,
    tenant_id: uuid.UUID = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
) -> PageResponse[AdvanceSalaryOut]:
    stmt = (
        select(*_ADVANCE_COLUMNS)
        .join(Employee, Employee.id == AdvanceSalary.employee_id)
        .where(AdvanceSalary.tenant_id == tenant_id)
    )
    if from_:
        stmt = stmt.where(AdvanceSalary.entry_date >= from_)
    if to:
        stmt = stmt.where(AdvanceSalary.entry_date <= to)
    if employee_id:
        stmt = stmt.where(AdvanceSalary.employee_id == employee_id)

    total = (await db.execute(select(func.count()).select_from(stmt.subquery()))).scalar_one()
    rows = (
        await db.execute(
            stmt.order_by(AdvanceSalary.entry_date.desc(), AdvanceSalary.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
    ).all()

    return PageResponse(
        items=[AdvanceSalaryOut(**row._mapping) for row in rows], total=total, page=page, page_size=page_size
    )


@router.post("/advance", response_model=AdvanceSalaryOut, status_code=status.HTTP_201_CREATED)
async def create_advance_salary(
    payload: AdvanceSalaryCreate,
    tenant_id: uuid.UUID = Depends(get_current_tenant),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AdvanceSalaryOut:
    employee = await _get_employee_or_404(payload.employee_id, tenant_id, db)

    advance = AdvanceSalary(
        tenant_id=tenant_id,
        entry_date=payload.entry_date,
        employee_id=payload.employee_id,
        amount=payload.amount,
        adjusted_status="pending",
        created_by=user.id,
    )
    db.add(advance)
    await db.flush()

    # Cashbook is the single source of truth for cash position (CLAUDE.md rule 7).
    await create_cashbook_entry(
        db,
        tenant_id=tenant_id,
        entry_date=payload.entry_date,
        type=CashbookType.advance_salary,
        amount=-payload.amount,
        mode=PaymentMode.cash,
        created_by=user.id,
        linked_ref_type="advance_salary",
        linked_ref_id=advance.id,
    )

    await db.commit()
    await db.refresh(advance)
    return AdvanceSalaryOut(
        id=advance.id,
        entry_date=advance.entry_date,
        employee_id=advance.employee_id,
        employee_name=employee.name,
        amount=advance.amount,
        adjusted_status=advance.adjusted_status,
        created_by=advance.created_by,
        created_at=advance.created_at,
    )


@router.patch("/advance/{advance_id}", response_model=AdvanceSalaryOut)
async def update_advance_salary(
    advance_id: uuid.UUID,
    payload: AdvanceSalaryUpdate,
    tenant_id: uuid.UUID = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
) -> AdvanceSalaryOut:
    result = await db.execute(
        select(AdvanceSalary, Employee.name)
        .join(Employee, Employee.id == AdvanceSalary.employee_id)
        .where(AdvanceSalary.id == advance_id, AdvanceSalary.tenant_id == tenant_id)
    )
    row = result.first()
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Advance salary not found")
    advance, employee_name = row

    advance.adjusted_status = payload.adjusted_status
    await db.commit()
    await db.refresh(advance)
    return AdvanceSalaryOut(
        id=advance.id,
        entry_date=advance.entry_date,
        employee_id=advance.employee_id,
        employee_name=employee_name,
        amount=advance.amount,
        adjusted_status=advance.adjusted_status,
        created_by=advance.created_by,
        created_at=advance.created_at,
    )


@router.get("/{employee_id}/ledger", response_model=EmployeeLedgerOut)
async def employee_ledger(
    employee_id: uuid.UUID,
    from_: date | None = Query(None, alias="from"),
    to: date | None = None,
    tenant_id: uuid.UUID = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
) -> EmployeeLedgerOut:
    employee = await _get_employee_or_404(employee_id, tenant_id, db)

    salary_stmt = select(SalaryPayment).where(
        SalaryPayment.tenant_id == tenant_id, SalaryPayment.employee_id == employee_id
    )
    advance_stmt = select(AdvanceSalary).where(
        AdvanceSalary.tenant_id == tenant_id, AdvanceSalary.employee_id == employee_id
    )
    if from_:
        salary_stmt = salary_stmt.where(SalaryPayment.entry_date >= from_)
        advance_stmt = advance_stmt.where(AdvanceSalary.entry_date >= from_)
    if to:
        salary_stmt = salary_stmt.where(SalaryPayment.entry_date <= to)
        advance_stmt = advance_stmt.where(AdvanceSalary.entry_date <= to)

    salary_rows = (await db.execute(salary_stmt)).scalars().all()
    advance_rows = (await db.execute(advance_stmt)).scalars().all()

    entries = [
        EmployeeLedgerEntry(
            id=r.id, entry_date=r.entry_date, type="salary", amount=r.amount, period_month=r.period_month
        )
        for r in salary_rows
    ] + [
        EmployeeLedgerEntry(
            id=r.id,
            entry_date=r.entry_date,
            type="advance_salary",
            amount=r.amount,
            adjusted_status=r.adjusted_status,
        )
        for r in advance_rows
    ]
    entries.sort(key=lambda e: e.entry_date)

    total_salary_paid = sum((r.amount for r in salary_rows), Decimal("0"))
    total_advances_given = sum((r.amount for r in advance_rows), Decimal("0"))
    total_advances_adjusted = sum(
        (r.amount for r in advance_rows if r.adjusted_status == "adjusted"), Decimal("0")
    )

    return EmployeeLedgerOut(
        employee_id=employee.id,
        employee_name=employee.name,
        total_salary_paid=total_salary_paid,
        total_advances_given=total_advances_given,
        total_advances_adjusted=total_advances_adjusted,
        advances_outstanding=total_advances_given - total_advances_adjusted,
        entries=entries,
    )


@router.get("/{employee_id}", response_model=EmployeeOut)
async def get_employee(
    employee_id: uuid.UUID,
    tenant_id: uuid.UUID = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
) -> EmployeeOut:
    employee = await _get_employee_or_404(employee_id, tenant_id, db)
    return EmployeeOut.model_validate(employee)


@router.patch("/{employee_id}", response_model=EmployeeOut)
async def update_employee(
    employee_id: uuid.UUID,
    payload: EmployeeUpdate,
    tenant_id: uuid.UUID = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
) -> EmployeeOut:
    employee = await _get_employee_or_404(employee_id, tenant_id, db)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(employee, field, value)
    await db.commit()
    await db.refresh(employee)
    return EmployeeOut.model_validate(employee)
