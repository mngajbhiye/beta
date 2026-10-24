from pydantic import BaseModel, Field


class TransactionItem(BaseModel):
    transactionId: str = Field(min_length=1)
    productId: str = Field(min_length=1)

    productName: str = Field(min_length=1, max_length=150)

    quantity: float = Field(gt=0)
    unitPrice: float = Field(ge=0)
