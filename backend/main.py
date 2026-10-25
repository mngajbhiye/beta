from fastapi import FastAPI
from firebase import db

from models import Product, Customer, TransactionCreate, TransactionReturnCreate
from repositories.productRepository import ProductRepository
from repositories.customerRepository import CustomerRepository
from repositories.transactionRepository import TransactionRepository

app = FastAPI()

product_repo = ProductRepository()
customer_repo = CustomerRepository()
transaction_repo = TransactionRepository()


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


@app.get("/customer",
          summary="Creates a customer",
          description="Creates a new customer in Firestore and returns its details along with the generated ID.",
          response_description="The newly created customer and its ID")
async def createCustomer(customer: Customer) -> dict:
    return await customer_repo.get(customer)
    

@app.get("/list-customers",
         summary="Fetches all customers",
         description="Gets all customers in Firestore and returns its details along with the generated customer ID.",
         response_description="list of customers and their IDs")
async def getCustomer() -> dict:
   return {"customers": await customer_repo.getAll()}


@app.post("/transaction",
          summary="Create a transaction",
          description="Creates a new transaction in Firestore and returns its details along with the generated transaction ID.",
          response_description="The newly created transaction and its ID")
async def createtransaction(transaction: TransactionCreate) -> dict:
    return await transaction_repo.create(transaction)


@app.delete("/transactions/{transaction_id}",
            summary="Deletes a transaction",
            description="Deletes a transaction in Firestore and returns its details along with the transaction ID.",
            response_description="The deleted transaction items and its transaction ID")
async def delete_transaction(transaction_id: str):
    return await transaction_repo.delete(transaction_id)


@app.get("/customers/{customer_id}/transactions",
         summary="Shows transaction related to a customer",
         description=".",
         response_description="List of transactions")
async def get_customer_transactions(customer_id: str):
    return await transaction_repo.getByCustomerId(customer_id)


@app.post("/transactions/returns")
async def return_item(payload: TransactionReturnCreate):
    return await transaction_repo.return_item(payload)
