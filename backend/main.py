from fastapi import FastAPI
from firebase import db

from models import Product

app = FastAPI()


@app.get("/")
async def root():
    return {"message": "Hello World"}


@app.post("/product",
          summary="Create a product",
          description="Creates a new product in Firestore and returns its details along with the generated product ID.",
          response_description="The newly created product and its ID")
async def createProduct(product: Product) -> dict:
    """Create a new product in Firestore."""
    doc_ref = db.collection("products").document()

    await doc_ref.set(product.model_dump())

    return {
        "productId": doc_ref.id,
        **product.model_dump()
    }


@app.get("/products",
         summary="Fetches all products",
         description="Gets all products in Firestore and returns its details along with the generated product ID.",
         response_description="The products and their IDs")
async def getProducts() -> dict:
    """Fetches products in Firestore."""
    products_ref = db.collection("products").stream()

    products = []

    async for doc in products_ref:
        products.append({
            "productId": doc.id,
            **doc.to_dict()
        })

    return {"products": products}
