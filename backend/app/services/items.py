import uuid

from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.item import Item


async def upsert_item(db: AsyncSession, *, tenant_id: uuid.UUID, name: str) -> None:
    """Remembers an item description so it shows up in /search/items autocomplete."""
    name = name.strip()
    if not name:
        return
    stmt = (
        pg_insert(Item)
        .values(tenant_id=tenant_id, name=name)
        .on_conflict_do_nothing(index_elements=[Item.tenant_id, Item.name])
    )
    await db.execute(stmt)
