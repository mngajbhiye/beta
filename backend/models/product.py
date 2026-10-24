from pydantic import BaseModel, Field


class Product(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    category: str = Field(min_length=1, max_length=100)

    purchasePrice: float = Field(ge=0)
    sellingPrice: float = Field(ge=0)

    stockQuantity: float = Field(ge=0)
    unit: str = Field(min_length=1, max_length=30)
