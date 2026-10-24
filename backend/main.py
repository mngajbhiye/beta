from fastapi import FastAPI
from firebase import db

from models import Product, Customer
from repositories.productRepository import ProductRepository
from repositories.customerRepository import CustomerRepository

app = FastAPI()

product_repo = ProductRepository()
customer_repo = CustomerRepository()


@app.get("/")
async def root():
    return {"message": "Hello World"}


@app.post("/product",
          summary="Create a product",
          description="Creates a new product in Firestore and returns its details along with the generated product ID.",
          response_description="The newly created product and its ID")
async def createProduct(product: Product) -> dict:
    return await product_repo.create(product)


@app.get("/products",
         summary="Fetches all products",
         description="Gets all products in Firestore and returns its details along with the generated product ID.",
         response_description="The products and their IDs")
async def getProducts() -> dict:
   return {"products" : await product_repo.getAll()}


@app.post("/customer",
          summary="Creates a customer",
          description="Creates a new customer in Firestore and returns its details along with the generated ID.",
          response_description="The newly created customer and its ID")
async def createCustomer(customer: Customer) -> dict:
    return await customer_repo.create(customer)
    

@app.get("/customer",
         summary="Fetches all products",
         description="Gets all products in Firestore and returns its details along with the generated product ID.",
         response_description="The products and their IDs")
async def getCustomer() -> dict:
   return {"customers": await customer_repo.getAll()}
