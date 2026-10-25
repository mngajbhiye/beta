from firebase import db
from models import Product
from settings import PRODUCTS_COLL


class ProductRepository:
    def __init__(self):
        self.collection = db.collection(PRODUCTS_COLL)

    async def getAll(self):
        """Fetches products in Firestore."""
        products_ref = self.collection.stream()

        products = []

        async for doc in products_ref:
            products.append({
                "productId": doc.id,
                **doc.to_dict()
            })

        return products

    async def create(self, product: Product):
        """Create a new product in Firestore."""

        _, doc_ref = await self.collection.add(product.model_dump())

        return {
            "productId": doc_ref.id,
            **product.model_dump()
        }
