from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, UUIDPrimaryKeyMixin, TimestampMixin


class Tenant(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """A subscribing business/firm. All business data is scoped to a tenant."""
    __tablename__ = "tenants"

    name: Mapped[str] = mapped_column(String, nullable=False)
    slug: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    currency: Mapped[str] = mapped_column(String, default="INR", nullable=False)
    logo_url: Mapped[str | None] = mapped_column(String, nullable=True)
