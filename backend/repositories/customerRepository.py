from firebase import db
from models import Customer


class CustomerRepository:
    def __init__(self):
        self.collection = db.collection("customers")

    async def getAll(self):
        """Fetches customers from Firestore."""
        customers_ref = db.collection("customers").stream()

        customers = []

        async for doc in customers_ref:
            customers.append({
                "productId": doc.id,
                **doc.to_dict()
            })

        return customers

    async def create(self, customer: Customer):
        """Create a new customer in Firestore."""
        doc_ref = db.collection("customers").document()

        await doc_ref.set(customer.model_dump())

        return {
            "customerId": doc_ref.id,
            **customer.model_dump()
        }
