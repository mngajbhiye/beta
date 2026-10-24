from pydantic import BaseModel, Field


class Customer(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    phone: str = Field(min_length=1, max_length=20)
    address: str = Field(min_length=1, max_length=500)
