from datetime import datetime, timezone
from typing import Literal

from pydantic import BaseModel, Field

from typing import Literal

from pydantic import BaseModel, Field


class TransactionItem(BaseModel):
    transactionId: str = Field(min_length=1)
    productId: str = Field(min_length=1)

    productName: str = Field(min_length=1, max_length=150)

    quantity: float = Field(gt=0)
    unitPrice: float = Field(ge=0)


class TransactionItemInput(BaseModel):
    productId: str = Field(min_length=1)
    quantity: float = Field(gt=0)
    unitPrice: float | None = Field(default=None, ge=0)


class TransactionCreate(BaseModel):
    customerName: str = Field(min_length=1, max_length=100)
    phone: str = Field(min_length=1, max_length=20)

    type: Literal["sale", "purchase", "return"]
    amtExchanged: float = Field(default=0, ge=0)
    status: Literal["pending", "completed", "settled"] = "completed"
    items: list[TransactionItemInput] = Field(min_length=1)


class Transaction(BaseModel):
    customerId: str = Field(min_length=1)

    type: Literal["sale", "purchase", "return"]

    dateTime: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

    totalAmount: float = Field(ge=0)
    amtExchanged: float = Field(default=0, ge=0)

    status: str = Field(default="completed", min_length=1)


class ReturnItemInput(BaseModel):
    productId: str = Field(min_length=1)
    quantity: float = Field(gt=0)
    amtExchanged: float = Field(default=0, ge=0)


class TransactionReturnCreate(BaseModel):
    customerId: str = Field(min_length=1)
    items: list[ReturnItemInput] = Field(min_length=1)
    reason: str | None = Field(default=None, max_length=500)
    amtExchanged: float = Field(default=0, ge=0)
