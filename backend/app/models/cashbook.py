import enum
import uuid
from datetime import date
from decimal import Decimal

from sqlalchemy import Date, Enum, ForeignKey, Numeric, String
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, UUIDPrimaryKeyMixin, TimestampMixin, TenantScopedMixin


class CashbookType(str, enum.Enum):
    credit = "credit"
    debit = "debit"
    sales_payment = "sales_payment"
    purchase_payment = "purchase_payment"
    salary = "salary"
    advance_salary = "advance_salary"
    transfer = "transfer"


class PaymentMode(str, enum.Enum):
    cash = "cash"
    bank = "bank"
    upi = "upi"


class CashbookEntry(UUIDPrimaryKeyMixin, TenantScopedMixin, TimestampMixin, Base):
    """
    Single source of truth for cash position. Every sales payment, purchase
    payment, salary, and advance salary MUST create a linked row here.
    """
    __tablename__ = "cashbook_entries"

    entry_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    type: Mapped[CashbookType] = mapped_column(Enum(CashbookType, name="cashbook_type"), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    mode: Mapped[PaymentMode] = mapped_column(Enum(PaymentMode, name="payment_mode"), nullable=False)
    category: Mapped[str | None] = mapped_column(String, nullable=True)
    linked_ref_type: Mapped[str | None] = mapped_column(String, nullable=True)
    linked_ref_id: Mapped[uuid.UUID | None] = mapped_column(PGUUID(as_uuid=True), nullable=True)
    remarks: Mapped[str | None] = mapped_column(String, nullable=True)
    created_by: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
