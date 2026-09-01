import uuid

from pydantic import BaseModel


class ItemOut(BaseModel):
    id: uuid.UUID
    name: str

    model_config = {"from_attributes": True}
