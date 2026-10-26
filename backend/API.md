# Backend API

This API is implemented with FastAPI and stores data in Firestore. Unless
otherwise noted, request and response bodies use JSON. FastAPI validation
errors are returned with HTTP `422`.

For interactive documentation while the server is running, open `/docs` or
`/redoc`.

## Endpoints

### `GET /`

Health check / welcome endpoint. No request payload.

**Response — `200 OK`**

```json
{
  "message": "Hello World"
}
```

### `POST /product`

Creates a product.

**Request body**

| Field | Type | Constraints |
|---|---|---|
| `name` | string | 1–150 characters |
| `category` | string | 1–100 characters |
| `purchasePrice` | number | At least `0` |
| `sellingPrice` | number | At least `0` |
| `stockQuantity` | number | At least `0` |
| `unit` | string | 1–30 characters |

```json
{
  "name": "Coffee",
  "category": "Grocery",
  "purchasePrice": 8.5,
  "sellingPrice": 12,
  "stockQuantity": 25,
  "unit": "bag"
}
```

**Response — `200 OK`**

Returns the created product, including its generated `productId`.

```json
{
  "productId": "firestore-product-id",
  "name": "Coffee",
  "category": "Grocery",
  "purchasePrice": 8.5,
  "sellingPrice": 12,
  "stockQuantity": 25,
  "unit": "bag"
}
```

### `GET /products`

Fetches all products. No request payload.

**Response — `200 OK`**

```json
{
  "products": [
    {
      "productId": "firestore-product-id",
      "name": "Coffee",
      "category": "Grocery",
      "purchasePrice": 8.5,
      "sellingPrice": 12,
      "stockQuantity": 25,
      "unit": "bag"
    }
  ]
}
```

### `GET /customer`

Looks up a customer by `name` and `phone`, returning the existing customer ID
or creating a customer if no match is found. The handler expects a `Customer`
JSON body even though this is a `GET` endpoint; clients should account for
that, or the route should be changed to `POST`.

**Request body**

| Field | Type | Constraints |
|---|---|---|
| `name` | string | 1–100 characters |
| `phone` | string | 1–20 characters |
| `address` | string or `null` | Optional; if supplied, 1–500 characters |

```json
{
  "name": "Alex Morgan",
  "phone": "555-0100",
  "address": "12 Market Street"
}
```

**Response — `200 OK`**

If an existing customer is found, only `customerId` is returned. If a customer
is created, the response also includes the submitted customer fields.

```json
{
  "customerId": "firestore-customer-id",
  "name": "Alex Morgan",
  "phone": "555-0100",
  "address": "12 Market Street"
}
```

### `GET /list-customers`

Fetches all customers. No request payload.

**Response — `200 OK`**

```json
{
  "customers": [
    {
      "productId": "firestore-document-id",
      "name": "Alex Morgan",
      "phone": "555-0100",
      "address": "12 Market Street"
    }
  ]
}
```

> The current implementation labels each customer's document ID as
> `productId`. This appears to be a response-field naming bug; clients should
> not assume it is a customer ID until the implementation is corrected.

### `GET /transactions`

Fetches all transactions. No request payload.

**Response — `200 OK`**

```json
{
  "transactions": [
    {
      "transactionId": "firestore-transaction-id",
      "customerId": "firestore-customer-id",
      "type": "sale",
      "dateTime": "2026-10-26T00:00:00+00:00",
      "totalAmount": 24,
      "amtExchanged": 24,
      "status": "completed"
    }
  ]
}
```

Each record includes its stored transaction fields. The date is serialized by
Firestore and may be represented differently from this example.

### `POST /transactions`

Creates a sale, purchase, or return transaction and its line items. The
customer is found or created using the supplied name and phone. The server
loads each product, uses its `sellingPrice` for sales and `purchasePrice` for
purchases when `unitPrice` is omitted, and calculates line subtotals and the
transaction total. Sales decrease product stock, while purchases and returns
increase it. Stock changes are committed with the transaction and its line
items; a sale exceeding available stock returns HTTP `400`. Missing products
result in HTTP `404`.

**Request body**

| Field | Type | Constraints / behavior |
|---|---|---|
| `customerName` | string | 1–100 characters |
| `phone` | string | 1–20 characters |
| `type` | string | `"sale"`, `"purchase"`, or `"return"` |
| `amtExchanged` | number | At least `0`; defaults to `0` |
| `status` | string | `"pending"`, `"completed"`, or `"settled"`; defaults to `"completed"`, but the handler derives the saved status from the amount exchanged instead |
| `items` | array | At least one item |
| `items[].productId` | string | Non-empty Firestore product ID |
| `items[].quantity` | number | Greater than `0` |
| `items[].unitPrice` | number or `null` | Optional; at least `0` if supplied; otherwise uses the product price |

```json
{
  "customerName": "Alex Morgan",
  "phone": "555-0100",
  "type": "sale",
  "amtExchanged": 24,
  "items": [
    {
      "productId": "firestore-product-id",
      "quantity": 2
    }
  ]
}
```

**Response — `200 OK`**

```json
{
  "transactionId": "firestore-transaction-id",
  "customerId": "firestore-customer-id",
  "type": "sale",
  "dateTime": "2026-10-26T00:00:00+00:00",
  "totalAmount": 24,
  "amtExchanged": 24,
  "status": "completed",
  "items": [
    {
      "itemId": "firestore-item-id",
      "transactionId": "firestore-transaction-id",
      "productId": "firestore-product-id",
      "productName": "Coffee",
      "quantity": 2,
      "unitPrice": 12,
      "subtotal": 24
    }
  ]
}
```

The status is `"completed"` when `amtExchanged >= totalAmount`; otherwise it
is `"pending"`. The request's `status` value does not control the saved status.
This endpoint does not implement inventory changes for sales or purchases.

### `DELETE /transactions/{transaction_id}`

Deletes the specified transaction and its associated line items.

**Path parameter**

| Parameter | Type | Description |
|---|---|---|
| `transaction_id` | string | Firestore transaction document ID |

No request body.

**Response — `200 OK`**

```json
{
  "message": "Transaction deleted successfully.",
  "transactionId": "firestore-transaction-id",
  "deletedItems": 2
}
```

Returns HTTP `404` if the transaction does not exist.

### `GET /transactions/customers/{customer_id}`

Fetches transactions for one customer, including each transaction's line
items.

**Path parameter**

| Parameter | Type | Description |
|---|---|---|
| `customer_id` | string | Firestore customer document ID |

No request body.

**Response — `200 OK`**

```json
[
  {
    "transactionId": "firestore-transaction-id",
    "customerId": "firestore-customer-id",
    "type": "sale",
    "dateTime": "2026-10-26T00:00:00+00:00",
    "totalAmount": 24,
    "amtExchanged": 24,
    "status": "completed",
    "items": [
      {
        "itemId": "firestore-item-id",
        "transactionId": "firestore-transaction-id",
        "productId": "firestore-product-id",
        "productName": "Coffee",
        "quantity": 2,
        "unitPrice": 12,
        "subtotal": 24
      }
    ]
  }
]
```

Returns an empty array when the customer has no transactions.

### `POST /transactions/returns`

Creates a return transaction and adds the returned quantities back to product
stock. Returns HTTP `404` if the customer or any product does not exist.

**Request body**

| Field | Type | Constraints / behavior |
|---|---|---|
| `customerId` | string | Non-empty Firestore customer ID |
| `items` | array | At least one return item |
| `items[].productId` | string | Non-empty Firestore product ID |
| `items[].quantity` | number | Greater than `0` |
| `reason` | string or `null` | Optional; maximum 500 characters |
| `amtExchanged` | number | At least `0`; defaults to `0` |

```json
{
  "customerId": "firestore-customer-id",
  "items": [
    {
      "productId": "firestore-product-id",
      "quantity": 1
    }
  ],
  "reason": "Damaged packaging",
  "amtExchanged": 12
}
```

**Response — `200 OK`**

```json
{
  "transactionId": "firestore-transaction-id",
  "customerId": "firestore-customer-id",
  "type": "return",
  "totalAmount": 12,
  "status": "completed",
  "dateTime": "2026-10-26T00:00:00+00:00",
  "reason": "Damaged packaging",
  "amtExchange": 12,
  "items": [
    {
      "itemId": "firestore-item-id",
      "transactionId": "firestore-transaction-id",
      "productId": "firestore-product-id",
      "productName": "Coffee",
      "quantity": 1,
      "unitPrice": 12,
      "subtotal": 12
    }
  ]
}
```

The response currently spells the amount field `amtExchange` (without the
final `d`), unlike the request field `amtExchanged`.

### `POST /payments`

Records a payment as a transaction. Returns HTTP `404` if the customer does
not exist.

**Request body**

| Field | Type | Constraints / behavior |
|---|---|---|
| `customerId` | string | Non-empty Firestore customer ID |
| `amount` | number | Greater than `0` |
| `direction` | string | `"received"` or `"paid"` |
| `dateTime` | datetime string | Optional; defaults to the current UTC time |
| `method` | string | `"cash"`, `"upi"`, `"card"`, `"bank_transfer"`, or `"other"` |

```json
{
  "customerId": "firestore-customer-id",
  "amount": 24,
  "direction": "received",
  "dateTime": "2026-10-26T00:00:00Z",
  "method": "cash"
}
```

**Response — `200 OK`**

```json
{
  "transactionId": "firestore-transaction-id",
  "customerId": "firestore-customer-id",
  "type": "payment",
  "amtExchanged": 24,
  "direction": "received",
  "method": "cash",
  "status": "completed",
  "dateTime": "2026-10-26T00:00:00+00:00"
}
```
