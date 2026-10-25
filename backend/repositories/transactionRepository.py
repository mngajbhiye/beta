from models import TransactionReturnCreate
from settings import TRANSACTIONS_COLL, PRODUCTS_COLL, TRANSACTIONS_ITEMS_COLL, CUSTOMERS_COLL
from settings import (
    TRANSACTIONS_COLL,
    PRODUCTS_COLL,
    TRANSACTIONS_ITEMS_COLL,
)
from repositories.customerRepository import CustomerRepository
from models import TransactionCreate, Transaction, Customer
from firebase import db
from fastapi import HTTPException
from datetime import datetime, timezone
from google.cloud.firestore_v1.base_query import FieldFilter
import asyncio

customerRepo = CustomerRepository()


class TransactionRepository:
    def __init__(self):
        self.collection = db.collection(TRANSACTIONS_COLL)

    async def getAll(self):
        """Fetch all transactions from Firestore."""
        transactions_ref = self.collection.stream()
        transactions = []

        async for doc in transactions_ref:
            transactions.append({
                "transactionId": doc.id,
                **doc.to_dict(),
            })

        return transactions

    async def create(self, payload: TransactionCreate) -> dict:
        """Create a transaction and its items atomically."""

        # Stage 1: Retrieve customer details.
        customer_payload = Customer(
            name=payload.customerName,
            phone=payload.phone,
        )

        customer_detail = await customerRepo.get(customer_payload)
        customer_id = customer_detail["customerId"]

        # Stage 2: Fetch each unique product once.
        product_ids = {item.productId for item in payload.items}

        async def fetch_product(product_id: str):
            product_ref = (
                db.collection(PRODUCTS_COLL).document(product_id)
            )
            return product_id, await product_ref.get()

        results = await asyncio.gather(
            *(fetch_product(product_id) for product_id in product_ids)
        )

        # Request-level product cache.
        product_cache = {}

        for product_id, product_doc in results:
            if not product_doc.exists:
                raise HTTPException(
                    status_code=404,
                    detail=f"Product '{product_id}' not found.",
                )

            product_cache[product_id] = product_doc.to_dict()

        # Stage 3: Calculate item prices and transaction total.
        price_field = (
            "sellingPrice"
            if payload.type == "sale"
            else "purchasePrice"
        )

        transaction_items = []
        total_amount = 0.0

        for item in payload.items:
            product = product_cache[item.productId]

            if price_field not in product:
                raise HTTPException(
                    status_code=500,
                    detail=(
                        f"Product '{item.productId}' "
                        f"does not have a {price_field}."
                    ),
                )

            unit_price = (
                item.unitPrice
                if item.unitPrice is not None
                else product[price_field]
            )

            subtotal = round(unit_price * item.quantity, 2)
            total_amount += subtotal

            transaction_items.append({
                "productId": item.productId,
                "productName": product["name"],
                "quantity": item.quantity,
                "unitPrice": unit_price,
                "subtotal": subtotal,
            })

        total_amount = round(total_amount, 2)

        # Stage 4: Prepare the transaction data.
        transaction = Transaction(
            customerId=customer_id,
            type=payload.type,
            totalAmount=total_amount,
            status=payload.status,
        )

        transaction_data = transaction.model_dump(mode="python")

        # Stage 5: Create references and queue all writes.
        transaction_ref = self.collection.document()
        batch = db.batch()

        batch.set(transaction_ref, transaction_data)

        saved_items = []

        for item_data in transaction_items:
            item_ref = db.collection(TRANSACTIONS_ITEMS_COLL).document()

            stored_item = {
                "transactionId": transaction_ref.id,
                **item_data,
            }

            batch.set(item_ref, stored_item)

            saved_items.append({
                "itemId": item_ref.id,
                **stored_item,
            })

        # Stage 6: Commit the transaction and items atomically.
        await batch.commit()

        # Stage 7: Return the created data.
        return {
            "transactionId": transaction_ref.id,
            **transaction_data,
            "dateTime": transaction_data["dateTime"].isoformat(),
            "items": saved_items,
        }


    async def delete(self, transaction_id: str) -> dict:
        """Delete a transaction and all its associated items."""

        transaction_ref = self.collection.document(transaction_id)
        transaction_doc = await transaction_ref.get()

        if not transaction_doc.exists:
            raise HTTPException(
                status_code=404,
                detail=f"Transaction '{transaction_id}' not found.",
            )

        # Find all items belonging to this transaction.
        items_query = (
            db.collection(TRANSACTIONS_ITEMS_COLL)
            .where(
                filter=FieldFilter(
                    "transactionId", "==", transaction_id
                )
            )
        )

        item_docs = [
            doc async for doc in items_query.stream()
        ]

        # Queue the item deletions and transaction deletion.
        batch = db.batch()

        for item_doc in item_docs:
            batch.delete(item_doc.reference)

        batch.delete(transaction_ref)

        await batch.commit()

        return {
            "message": "Transaction deleted successfully.",
            "transactionId": transaction_id,
            "deletedItems": len(item_docs),
        }

    async def getByCustomerId(self, customer_id: str) -> list[dict]:
        """Fetch all transactions and their items belonging to a customer."""

        query = self.collection.where(
            filter=FieldFilter("customerId", "==", customer_id)
        )

        transactions = []

        async for doc in query.stream():
            transaction = {
                "transactionId": doc.id,
                **doc.to_dict(),
            }

            items_query = db.collection(TRANSACTIONS_ITEMS_COLL).where(
                filter=FieldFilter("transactionId", "==", doc.id)
            )

            items = []

            async for item_doc in items_query.stream():
                items.append({
                    "itemId": item_doc.id,
                    **item_doc.to_dict(),
                })

            transaction["items"] = items
            transactions.append(transaction)

        return transactions


    async def return_item(self, payload: TransactionReturnCreate) -> dict:
        """Create a return transaction and update product stock."""

        # Verify customer exists
        customer_ref = db.collection(CUSTOMERS_COLL).document(payload.customerId)
        customer_doc = await customer_ref.get()

        if not customer_doc.exists:
            raise HTTPException(status_code=404, detail="Customer not found.")

        transaction_ref = self.collection.document()
        batch = db.batch()

        total_amount = 0.0
        returned_items = []

        # Fetch each unique product only once
        product_ids = {item.productId for item in payload.items}
        products = {}

        for product_id in product_ids:
            product_ref = db.collection(PRODUCTS_COLL).document(product_id)
            product_doc = await product_ref.get()

            if not product_doc.exists:
                raise HTTPException(
                    status_code=404,
                    detail=f"Product '{product_id}' not found."
                )

            products[product_id] = {
                "reference": product_ref,
                "data": product_doc.to_dict(),
            }

        for item in payload.items:
            product = products[item.productId]["data"]
            product_ref = products[item.productId]["reference"]

            unit_price = float(product["sellingPrice"])
            subtotal = round(unit_price * item.quantity, 2)
            total_amount += subtotal

            item_ref = db.collection(TRANSACTIONS_ITEMS_COLL).document()

            item_data = {
                "transactionId": transaction_ref.id,
                "productId": item.productId,
                "productName": product["name"],
                "quantity": item.quantity,
                "unitPrice": unit_price,
                "subtotal": subtotal,
            }

            batch.set(item_ref, item_data)

            # Add returned quantity back to stock
            batch.update(
                product_ref,
                {"stockQuantity": product.get("stockQuantity", 0) + item.quantity}
            )

            returned_items.append({
                "itemId": item_ref.id,
                **item_data,
            })

        transaction_data = {
            "customerId": payload.customerId,
            "type": "return",
            "totalAmount": round(total_amount, 2),
            "status": "completed",
            "dateTime": datetime.now(timezone.utc),
            "reason": payload.reason,
        }

        batch.set(transaction_ref, transaction_data)
        await batch.commit()

        return {
            "transactionId": transaction_ref.id,
            **{
                **transaction_data,
                "dateTime": transaction_data["dateTime"].isoformat(),
            },
            "items": returned_items,
        }
