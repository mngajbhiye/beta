from datetime import datetime, timezone
from typing import Literal

from pydantic import BaseModel, Field


class Transaction(BaseModel):
    customerId: str = Field(min_length=1)

    type: Literal["sale", "purchase"]

    dateTime: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

    totalAmount: float = Field(ge=0)

    status: str = Field(default="completed", min_length=1)
