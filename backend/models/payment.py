from datetime import datetime, timezone
from typing import Literal

from pydantic import BaseModel, Field


class Payment(BaseModel):
    customerId: str = Field(min_length=1)
    transactionId: str = Field(min_length=1)

    amount: float = Field(gt=0)

    dateTime: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

    method: Literal[
        "cash",
        "upi",
        "card",
        "bank_transfer",
        "other"
    ]
