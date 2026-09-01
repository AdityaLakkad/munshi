from sqlalchemy import String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, UUIDPrimaryKeyMixin, TenantScopedMixin


class Item(UUIDPrimaryKeyMixin, TenantScopedMixin, Base):
    """Lightweight, reusable item names — powers item-description autocomplete."""
    __tablename__ = "items"
    __table_args__ = (UniqueConstraint("tenant_id", "name", name="uq_items_tenant_name"),)

    name: Mapped[str] = mapped_column(String, nullable=False, index=True)
