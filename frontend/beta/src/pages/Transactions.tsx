import { useCallback, useEffect, useState } from "react";
import { getCustomers } from "../services/customerService";
import { getProducts } from "../services/productService";
import CustomerSelect from "../components/CustomerSelect";
import {
  createPayment,
  createReturn,
  createSale,
  getTransactions,
  type PaymentInput,
  type ReturnInput,
  type SaleInput,
} from "../services/transactionService";
import type { Customer, CustomerTransaction, Product } from "../types/api";

type Operation = "sale" | "return" | "payment";
type Filter = "all" | Operation;

interface CartItem {
  productId: string;
  quantity: string;
  unitPrice: string;
}

const inputClass =
  "mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-500";

const buttonClass =
  "rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50";

function money(value: number) {
  return value.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });
}

function transactionAmount(transaction: CustomerTransaction) {
  return transaction.totalAmount ?? transaction.amtExchanged ?? 0;
}

function formatDate(value: string | undefined) {
  if (!value) return "—";

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("en-IN");
}

export default function Transactions() {
  const [transactions, setTransactions] = useState<CustomerTransaction[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [operation, setOperation] = useState<Operation | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const [customerId, setCustomerId] = useState("");
  const [items, setItems] = useState<CartItem[]>([
    { productId: "", quantity: "1", unitPrice: "" },
  ]);
  const [amount, setAmount] = useState("");
  const [direction, setDirection] =
    useState<PaymentInput["direction"]>("received");
  const [method, setMethod] = useState<PaymentInput["method"]>("cash");
  const [reason, setReason] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [transactionData, customerData, productData] = await Promise.all([
        getTransactions(),
        getCustomers(),
        getProducts(),
      ]);

      setTransactions(transactionData);
      setCustomers(customerData);
      setProducts(productData);
    } catch {
      setError("Failed to load transaction data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  function openForm(type: Operation) {
    setOperation(type);
    setCustomerId("");
    setItems([{ productId: "", quantity: "1", unitPrice: "" }]);
    setAmount("");
    setDirection("received");
    setMethod("cash");
    setReason("");
    setFormError("");
  }

  function closeForm() {
    if (saving) return;

    setOperation(null);
    setFormError("");
  }

  function updateItem(index: number, field: keyof CartItem, value: string) {
    setItems((current) =>
      current.map((item, i) => {
        if (i !== index) return item;

        if (field === "productId") {
          const product = products.find((p) => p.productId === value);

          return {
            ...item,
            productId: value,
            unitPrice:
              operation === "sale"
                ? String(product?.sellingPrice ?? "")
                : item.unitPrice,
          };
        }

        return { ...item, [field]: value };
      }),
    );
  }

  function addItem() {
    setItems((current) => [
      ...current,
      { productId: "", quantity: "1", unitPrice: "" },
    ]);
  }

  function removeItem(index: number) {
    setItems((current) => current.filter((_, i) => i !== index));
  }

  const selectedCustomer = customers.find(
    (customer) => customer.customerId === customerId,
  );

  const cartTotal = items.reduce((total, item) => {
    const quantity = Number(item.quantity);
    const unitPrice = Number(item.unitPrice);

    if (
      !item.productId ||
      !Number.isFinite(quantity) ||
      quantity <= 0 ||
      !Number.isFinite(unitPrice) ||
      unitPrice < 0
    ) {
      return total;
    }

    return total + quantity * unitPrice;
  }, 0);

  async function submitOperation(action: () => Promise<unknown>) {
    setSaving(true);

    try {
      await action();
      setOperation(null);
      await loadData();
    } catch {
      setFormError(
        "The transaction could not be saved. Check the details and try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    if (!operation) return;

    if (!selectedCustomer) {
      setFormError("Please select a customer.");
      return;
    }

    if (operation === "payment") {
      const paymentAmount = Number(amount);

      if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
        setFormError("Enter a valid payment amount.");
        return;
      }

      const payload: PaymentInput = {
        customerId: selectedCustomer.customerId,
        amount: paymentAmount,
        direction,
        method,
      };

      await submitOperation(() => createPayment(payload));
      return;
    }

    if (
      items.length === 0 ||
      items.some(
        (item) =>
          !item.productId ||
          !Number.isFinite(Number(item.quantity)) ||
          Number(item.quantity) <= 0 ||
          !Number.isFinite(Number(item.unitPrice)) ||
          Number(item.unitPrice) < 0,
      )
    ) {
      setFormError(
        "Select a product and enter valid quantities and prices for every item.",
      );
      return;
    }

    const validItems = items.map((item) => ({
      productId: item.productId,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
    }));

    if (operation === "sale") {
      const received = Number(amount || 0);

      if (!Number.isFinite(received) || received < 0 || received > cartTotal) {
        setFormError(
          "The amount received must be between zero and the sale total.",
        );
        return;
      }

      const payload: SaleInput = {
        customerId: selectedCustomer.customerId,
        type: "sale",
        amtExchanged: received,
        status: "completed",
        items: validItems,
      };

      await submitOperation(() => createSale(payload));
      return;
    }

    const refund = Number(amount || 0);

    if (!Number.isFinite(refund) || refund < 0 || refund > cartTotal) {
      setFormError(
        "The refund must be between zero and the total value of the returned items.",
      );
      return;
    }

    let allocated = 0;

    const returnItems = validItems.map((item, index) => {
      const lineTotal = item.quantity * item.unitPrice;

      const itemRefund =
        index === validItems.length - 1
          ? Math.round((refund - allocated) * 100) / 100
          : cartTotal > 0
            ? Math.round(((refund * lineTotal) / cartTotal) * 100) / 100
            : 0;

      allocated += itemRefund;

      return {
        productId: item.productId,
        quantity: item.quantity,
        amtExchanged: itemRefund,
      };
    });

    const payload: ReturnInput = {
      customerId: selectedCustomer.customerId,
      items: returnItems,
      amtExchanged: refund,
      ...(reason.trim() ? { reason: reason.trim() } : {}),
    };

    await submitOperation(() => createReturn(payload));
  }

  const filteredTransactions = transactions
    .filter((transaction) =>
      filter === "all" ? true : transaction.type === filter,
    )
    .filter((transaction) => {
      const customer = customers.find(
        (c) => c.customerId === transaction.customerId,
      );

      const searchText = [
        transaction.transactionId,
        transaction.customerId,
        transaction.customerName,
        transaction.phone,
        customer?.name,
        customer?.phone,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchText.includes(search.trim().toLowerCase());
    })
    .sort(
      (a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime(),
    );

  function renderItems(transaction: CustomerTransaction) {
    const transactionItems = transaction.items ?? [];

    if (transactionItems.length === 0) {
      return <span className="text-neutral-400">—</span>;
    }

    return (
      <details>
        <summary className="cursor-pointer whitespace-nowrap font-medium text-blue-600 hover:text-blue-800">
          View items ({transactionItems.length})
        </summary>

        <div className="mt-3 min-w-80 rounded-lg border border-neutral-200 bg-white p-3">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-neutral-500">
                <th className="py-2 pr-3 font-medium">Product</th>
                <th className="py-2 pr-3 text-right font-medium">Qty</th>
                <th className="py-2 pr-3 text-right font-medium">Price</th>
                <th className="py-2 text-right font-medium">Subtotal</th>
              </tr>
            </thead>

            <tbody>
              {transactionItems.map((item, index) => (
                <tr
                  key={item.itemId ?? `${item.productId}-${index}`}
                  className="border-b border-neutral-100 last:border-0"
                >
                  <td className="py-2 pr-3">
                    {item.productName || item.productId}
                  </td>
                  <td className="py-2 pr-3 text-right">{item.quantity}</td>
                  <td className="py-2 pr-3 text-right">
                    {money(item.unitPrice)}
                  </td>
                  <td className="py-2 text-right">
                    {money(item.subtotal ?? item.quantity * item.unitPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-neutral-900">
          Transactions
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Record sales, returns and customer payments.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => openForm("sale")}
          className={`${buttonClass} py-3`}
        >
          + New Sale
        </button>

        <button
          type="button"
          onClick={() => openForm("return")}
          className="rounded-md border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
        >
          + Return
        </button>

        <button
          type="button"
          onClick={() => openForm("payment")}
          className="rounded-md border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
        >
          + Payment
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
          <button
            type="button"
            onClick={() => void loadData()}
            className="ml-2 underline"
          >
            Retry
          </button>
        </div>
      )}

      <section className="rounded-xl border border-neutral-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-neutral-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-semibold text-neutral-900">
            Transaction History
          </h2>

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search customer or ID..."
            className="rounded-md border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-500 sm:max-w-xs"
          />
        </div>

        <div className="flex flex-wrap gap-2 border-b border-neutral-100 p-4">
          {(["all", "sale", "return", "payment"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`rounded-full px-3 py-1.5 text-sm capitalize ${
                filter === value
                  ? "bg-neutral-900 text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              {value === "all" ? "All" : value}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="p-10 text-center text-sm text-neutral-500">
            Loading transactions...
          </p>
        ) : filteredTransactions.length === 0 ? (
          <p className="p-10 text-center text-sm text-neutral-500">
            No transactions found.
          </p>
        ) : (
          <>
            {/* Desktop transaction table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-neutral-100 bg-neutral-50">
                  <tr>
                    <th className="px-4 py-3 font-medium text-neutral-500">
                      Date
                    </th>
                    <th className="px-4 py-3 font-medium text-neutral-500">
                      Customer
                    </th>
                    <th className="px-4 py-3 font-medium text-neutral-500">
                      Type
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-neutral-500">
                      Amount
                    </th>
                    <th className="px-4 py-3 font-medium text-neutral-500">
                      Status
                    </th>
                    <th className="px-4 py-3 font-medium text-neutral-500">
                      Items
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-neutral-100">
                  {filteredTransactions.map((transaction) => {
                    const customer = customers.find(
                      (c) => c.customerId === transaction.customerId,
                    );

                    return (
                      <tr
                        key={transaction.transactionId}
                        className="hover:bg-neutral-50"
                      >
                        <td className="px-4 py-3 text-neutral-600">
                          {formatDate(transaction.dateTime)}
                        </td>

                        <td className="px-4 py-3">
                          <p className="font-medium text-neutral-900">
                            {transaction.customerName ??
                              customer?.name ??
                              "Customer"}
                          </p>
                          <p className="font-mono text-xs text-neutral-400">
                            {transaction.customerId}
                          </p>
                        </td>

                        <td className="px-4 py-3">
                          <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs capitalize text-neutral-700">
                            {transaction.type}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-right font-medium text-neutral-900">
                          {money(transactionAmount(transaction))}
                        </td>

                        <td className="px-4 py-3 capitalize text-neutral-600">
                          {transaction.status || "—"}
                        </td>

                        <td className="px-4 py-3">
                          {renderItems(transaction)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile transaction cards */}
            <div className="space-y-3 p-3 md:hidden">
              {filteredTransactions.map((transaction) => {
                const customer = customers.find(
                  (c) => c.customerId === transaction.customerId,
                );

                return (
                  <article
                    key={transaction.transactionId}
                    className="rounded-lg border border-neutral-100 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-neutral-900">
                          {transaction.customerName ??
                            customer?.name ??
                            "Customer"}
                        </p>
                        <p className="mt-1 break-all font-mono text-xs text-neutral-400">
                          {transaction.transactionId}
                        </p>
                      </div>

                      <span className="shrink-0 rounded-full bg-neutral-100 px-2.5 py-1 text-xs capitalize">
                        {transaction.type}
                      </span>
                    </div>

                    <div className="mt-3 flex items-end justify-between gap-3 border-t border-neutral-100 pt-3">
                      <div>
                        <p className="text-xs text-neutral-500">
                          {formatDate(transaction.dateTime)}
                        </p>
                        <p className="mt-1 text-xs capitalize text-neutral-500">
                          {transaction.status || "—"}
                        </p>
                      </div>

                      <p className="font-semibold text-neutral-900">
                        {money(transactionAmount(transaction))}
                      </p>
                    </div>

                    <div className="mt-3 border-t border-neutral-100 pt-3">
                      {renderItems(transaction)}
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* Create transaction modal */}
      {operation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="transaction-form-title"
            className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-4 shadow-xl sm:p-6"
          >
            <div className="mb-5 flex items-center justify-between">
              <h2
                id="transaction-form-title"
                className="text-lg font-semibold capitalize text-neutral-900"
              >
                New {operation}
              </h2>

              <button
                type="button"
                disabled={saving}
                onClick={closeForm}
                className="rounded-md px-2 py-1 text-xl text-neutral-500 hover:bg-neutral-100"
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <CustomerSelect
                  customers={customers}
                  value={customerId}
                  onChange={setCustomerId}
                />
              </div>

              {operation !== "payment" && (
                <>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-neutral-800">
                        Items
                      </h3>

                      <button
                        type="button"
                        onClick={addItem}
                        className="text-sm font-medium text-neutral-700 underline"
                      >
                        + Add item
                      </button>
                    </div>

                    {items.map((item, index) => (
                      <div
                        key={index}
                        className="rounded-lg border border-neutral-200 p-3"
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <span className="text-xs font-medium text-neutral-500">
                            Item {index + 1}
                          </span>

                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="text-xs text-red-600"
                            >
                              Remove
                            </button>
                          )}
                        </div>

                        <select
                          id={`product-${index}`}
                          required
                          value={item.productId}
                          onChange={(event) =>
                            updateItem(index, "productId", event.target.value)
                          }
                          className={inputClass}
                        >
                          <option value="">Select product</option>
                          {products.map((product) => (
                            <option
                              key={product.productId}
                              value={product.productId}
                            >
                              {product.name} (stock: {product.stockQuantity}{" "}
                              {product.unit})
                            </option>
                          ))}
                        </select>

                        <div className="mt-3 grid grid-cols-2 gap-3">
                          <div>
                            <label
                              htmlFor={`quantity-${index}`}
                              className="text-sm text-neutral-700"
                            >
                              Quantity
                            </label>
                            <input
                              id={`quantity-${index}`}
                              type="number"
                              required
                              min="0.001"
                              step="any"
                              value={item.quantity}
                              onChange={(event) =>
                                updateItem(
                                  index,
                                  "quantity",
                                  event.target.value,
                                )
                              }
                              className={inputClass}
                            />
                          </div>

                          <div>
                            <label
                              htmlFor={`price-${index}`}
                              className="text-sm text-neutral-700"
                            >
                              Unit price (₹)
                            </label>
                            <input
                              id={`price-${index}`}
                              type="number"
                              required
                              min="0"
                              step="any"
                              value={item.unitPrice}
                              onChange={(event) =>
                                updateItem(
                                  index,
                                  "unitPrice",
                                  event.target.value,
                                )
                              }
                              className={inputClass}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between rounded-lg bg-neutral-50 p-3 text-sm">
                    <span className="text-neutral-600">
                      {operation === "return" ? "Return value" : "Sale total"}
                    </span>
                    <span className="font-semibold text-neutral-900">
                      {money(cartTotal)}
                    </span>
                  </div>

                  <div>
                    <label
                      htmlFor="transaction-amount"
                      className="text-sm font-medium text-neutral-700"
                    >
                      {operation === "sale"
                        ? "Amount received (₹)"
                        : "Amount refunded (₹)"}
                    </label>

                    <input
                      id="transaction-amount"
                      type="number"
                      min="0"
                      max={cartTotal}
                      step="any"
                      required
                      value={amount}
                      onChange={(event) => setAmount(event.target.value)}
                      className={inputClass}
                      placeholder="0.00"
                    />

                    <p className="mt-1 text-xs text-neutral-500">
                      {operation === "sale"
                        ? `Pending: ${money(Math.max(0, cartTotal - Number(amount || 0)))}`
                        : "Enter the amount actually refunded. It can be less than the return value."}
                    </p>
                  </div>

                  {operation === "return" && (
                    <div>
                      <label
                        htmlFor="reason"
                        className="text-sm font-medium text-neutral-700"
                      >
                        Return reason (optional)
                      </label>
                      <input
                        id="reason"
                        value={reason}
                        onChange={(event) => setReason(event.target.value)}
                        maxLength={500}
                        className={inputClass}
                        placeholder="Reason for return"
                      />
                    </div>
                  )}
                </>
              )}

              {operation === "payment" && (
                <>
                  <div>
                    <label
                      htmlFor="direction"
                      className="text-sm font-medium text-neutral-700"
                    >
                      Payment direction
                    </label>
                    <select
                      id="direction"
                      value={direction}
                      onChange={(event) =>
                        setDirection(
                          event.target.value as PaymentInput["direction"],
                        )
                      }
                      className={inputClass}
                    >
                      <option value="received">Received from customer</option>
                      <option value="paid">Paid to customer</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="payment-amount"
                      className="text-sm font-medium text-neutral-700"
                    >
                      Amount (₹)
                    </label>
                    <input
                      id="payment-amount"
                      type="number"
                      min="0.01"
                      step="any"
                      required
                      value={amount}
                      onChange={(event) => setAmount(event.target.value)}
                      className={inputClass}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="method"
                      className="text-sm font-medium text-neutral-700"
                    >
                      Payment method
                    </label>
                    <select
                      id="method"
                      value={method}
                      onChange={(event) =>
                        setMethod(event.target.value as PaymentInput["method"])
                      }
                      className={inputClass}
                    >
                      <option value="cash">Cash</option>
                      <option value="upi">UPI</option>
                      <option value="card">Card</option>
                      <option value="bank_transfer">Bank transfer</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </>
              )}

              {formError && (
                <p role="alert" className="text-sm text-red-600">
                  {formError}
                </p>
              )}

              <div className="flex justify-end gap-3 border-t border-neutral-100 pt-4">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="rounded-md border border-neutral-200 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button type="submit" disabled={saving} className={buttonClass}>
                  {saving ? "Saving..." : "Save transaction"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
