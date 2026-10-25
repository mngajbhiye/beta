from firebase import db
from models import Customer
from google.cloud.firestore_v1.base_query import FieldFilter


class CustomerRepository:
    def __init__(self):
        self.collection = db.collection("customers")

    async def getAll(self):
        """Fetches customers from Firestore."""
        customers_ref = self.collection.stream()

        customers = []

        async for doc in customers_ref:
            customers.append({
                "productId": doc.id,
                **doc.to_dict()
            })

        return customers

    async def get(self, customer: Customer) -> dict:
        """Returns the existing customer ID or creates a new customer and returns its ID."""

        query = (
            self.collection
            .where("name", "==", customer.name)
            .where(filter=FieldFilter("phone", "==", customer.phone))
            .limit(1)
        )

        docs = await query.get()

        for doc in docs:
            return {"customerId": doc.id}

        _, doc_ref = await self.collection.add(customer.model_dump())

        return {
            "customerId": doc_ref.id,
            **customer.model_dump()
        }
