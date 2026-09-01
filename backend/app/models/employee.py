from datetime import date
from decimal import Decimal

from sqlalchemy import Date, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, UUIDPrimaryKeyMixin, TimestampMixin, TenantScopedMixin


class Employee(UUIDPrimaryKeyMixin, TenantScopedMixin, TimestampMixin, Base):
    __tablename__ = "employees"

    name: Mapped[str] = mapped_column(String, nullable=False, index=True)
    designation: Mapped[str | None] = mapped_column(String, nullable=True)
    monthly_salary: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    joining_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String, default="active")  # active | inactive
