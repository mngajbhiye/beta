import { useEffect, useState } from "react";
import axios from "axios";
import type {
  Customer,
  CustomerTransaction,
  TransactionType,
} from "../../types/api";
import { getCustomerTransactions } from "../../services/transactionService";

interface CustomerTransactionsProps {
  customer: Customer;
  onClose: () => void;
}

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatAmount(amount: number): string {
  return currencyFormatter.format(amount);
}

function formatDate(dateTime: string): string {
  const date = new Date(dateTime);

  if (Number.isNaN(date.getTime())) {
    return dateTime;
  }

  return dateFormatter.format(date);
}

function getTransactionAmount(transaction: CustomerTransaction): number {
  if (transaction.type === "payment") {
    return transaction.amtExchanged ?? transaction.totalAmount ?? 0;
  }

  return transaction.totalAmount ?? 0;
}

function getTransactionLabel(type: TransactionType): string {
  switch (type) {
    case "sale":
      return "Sale";
    case "return":
      return "Return";
    case "payment":
      return "Payment";
    case "purchase":
      return "Purchase";
    default:
      return "Transaction";
  }
}

function getAmountStyle(type: TransactionType): string {
  switch (type) {
    case "sale":
      return "text-green-700";
    case "return":
      return "text-orange-700";
    case "payment":
      return "text-blue-700";
    case "purchase":
      return "text-purple-700";
    default:
      return "text-neutral-700";
  }
}

function getStatusStyle(status: string): string {
  switch (status.toLowerCase()) {
    case "completed":
      return "bg-emerald-50 text-emerald-700";
    case "pending":
      return "bg-amber-50 text-amber-700";
    case "failed":
    case "cancelled":
      return "bg-red-50 text-red-700";
    default:
      return "bg-neutral-100 text-neutral-600";
  }
}

function getTransactionDescription(transaction: CustomerTransaction): string {
  switch (transaction.type) {
    case "sale":
      return "Products purchased";

    case "return":
      return transaction.reason || "Returned products";

    case "payment":
      return (
        [transaction.method?.toUpperCase(), transaction.direction]
          .filter(Boolean)
          .join(" · ") || "Customer payment"
      );

    case "purchase":
      return "Products purchased for stock";

    default:
      return "Transaction";
  }
}

export default function CustomerTransactions({
  customer,
  onClose,
}: CustomerTransactionsProps) {
  const [transactions, setTransactions] = useState<CustomerTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadTransactions() {
      setIsLoading(true);
      setError("");

      try {
        const data = await getCustomerTransactions(customer.customerId);

        if (!cancelled) {
          setTransactions(
            [...data].sort(
              (a, b) =>
                new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime(),
            ),
          );
        }
      } catch (error: unknown) {
        if (cancelled) return;

        if (axios.isAxiosError(error)) {
          const detail = error.response?.data?.detail;

          setError(
            typeof detail === "string"
              ? detail
              : error.response
                ? "Unable to load transaction history."
                : "Unable to connect to the server. Check your connection.",
          );
        } else {
          setError("An unexpected error occurred.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadTransactions();

    return () => {
      cancelled = true;
    };
  }, [customer.customerId]);

  const getAmountExchanged = (transaction: CustomerTransaction) =>
    transaction.amtExchanged ?? 0;

  const totalSales = transactions
    .filter((t) => t.type === "sale")
    .reduce((sum, t) => sum + (t.totalAmount ?? 0), 0);

  const totalReturns = transactions
    .filter((t) => t.type === "return")
    .reduce((sum, t) => sum + (t.totalAmount ?? 0), 0);

  const saleReceipts = transactions
    .filter((t) => t.type === "sale")
    .reduce((sum, t) => sum + getAmountExchanged(t), 0);

  const refunds = transactions
    .filter((t) => t.type === "return")
    .reduce((sum, t) => sum + getAmountExchanged(t), 0);

  const paymentsReceived = transactions
    .filter((t) => t.type === "payment" && t.direction === "received")
    .reduce((sum, t) => sum + getAmountExchanged(t), 0);

  const totalAmount = totalSales - totalReturns;
  const totalReceived = saleReceipts + paymentsReceived - refunds;
  const totalPending = totalAmount - totalReceived;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-3"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="customer-transactions-title"
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xl"
      >
        {/* Header */}
        <header className="flex items-start justify-between gap-4 border-b border-neutral-100 px-5 py-4">
          <div className="min-w-0">
            <h2
              id="customer-transactions-title"
              className="text-left text-lg font-semibold tracking-tight text-neutral-900"
            >
              Transaction history
            </h2>

            <p className="mt-1 truncate text-sm text-neutral-600">
              {customer.name}
              {customer.phone ? ` · ${customer.phone}` : ""}
            </p>
            <div className="mt-1 text-sm text-neutral-500">
              Customer ID:{" "}
              <span className="font-mono text-neutral-700">
                {customer.customerId}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close transaction history"
            className="rounded-md px-2 py-1 text-xl leading-none text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
          >
            ×
          </button>
        </header>

        <div className="overflow-y-auto">
          {/* Summary */}
          {!isLoading && !error && transactions.length > 0 && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-neutral-200 p-4">
                <p className="text-sm text-neutral-500">Total Amount</p>
                <p className="mt-1 text-xl font-semibold text-neutral-900">
                  ₹
                  {totalAmount.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>

              <div className="rounded-lg border border-neutral-200 p-4">
                <p className="text-sm text-neutral-500">Total Received</p>
                <p className="mt-1 text-xl font-semibold text-green-700">
                  ₹
                  {totalReceived.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>

              <div className="rounded-lg border border-neutral-200 p-4">
                <p className="text-sm text-neutral-500">Pending</p>
                <p
                  className={`mt-1 text-xl font-semibold ${
                    totalPending > 0 ? "text-red-600" : "text-neutral-900"
                  }`}
                >
                  ₹
                  {totalPending.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>
          )}

          <div className="p-4 sm:p-5">
            {isLoading ? (
              <div className="py-12 text-center text-sm text-neutral-500">
                Loading transaction history...
              </div>
            ) : error ? (
              <div
                role="alert"
                className="rounded-md border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-700"
              >
                {error}
              </div>
            ) : transactions.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm font-medium text-neutral-800">
                  No transactions yet
                </p>
                <p className="mt-1 text-sm text-neutral-500">
                  Transactions for this customer will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <article
                    key={transaction.transactionId}
                    className="rounded-lg border border-neutral-200 p-3 transition hover:border-neutral-300 sm:p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-neutral-900">
                            {getTransactionLabel(transaction.type)}
                          </span>

                          <span
                            className={`rounded px-2 py-0.5 text-xs font-medium ${getStatusStyle(transaction.status)}`}
                          >
                            {transaction.status}
                          </span>
                        </div>

                        <p className="mt-1 text-sm text-neutral-600">
                          {getTransactionDescription(transaction)}
                        </p>

                        <p className="mt-1 text-xs text-neutral-400">
                          {formatDate(transaction.dateTime)}
                        </p>
                      </div>

                      <p
                        className={`shrink-0 text-sm font-semibold ${getAmountStyle(transaction.type)}`}
                      >
                        {formatAmount(getTransactionAmount(transaction))}
                      </p>
                    </div>

                    {(transaction.items?.length ?? 0) > 0 && (
                      <div className="mt-3 border-t border-neutral-100 pt-3">
                        <div className="space-y-2">
                          {transaction.items?.map((item) => (
                            <div
                              key={item.itemId}
                              className="flex items-start justify-between gap-3 text-sm"
                            >
                              <div className="min-w-0">
                                <p className="truncate text-neutral-800">
                                  {item.productName}
                                </p>

                                <p className="text-xs text-neutral-500">
                                  {item.quantity} ×{" "}
                                  {formatAmount(item.unitPrice)}
                                </p>
                              </div>

                              <span className="shrink-0 text-neutral-700">
                                {formatAmount(
                                  item.subtotal ??
                                    item.quantity * item.unitPrice,
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {transaction.type === "payment" && (
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-neutral-100 pt-3 text-xs text-neutral-500">
                        {transaction.method && (
                          <span>
                            Method: {transaction.method.toUpperCase()}
                          </span>
                        )}

                        {transaction.direction && (
                          <span>Direction: {transaction.direction}</span>
                        )}
                      </div>
                    )}

                    <p className="mt-3 truncate border-t border-neutral-100 pt-2 text-xs text-neutral-400">
                      ID: {transaction.transactionId}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-between border-t border-neutral-100 px-5 py-3">
          <p className="text-xs text-neutral-500">
            {isLoading
              ? "Fetching records..."
              : `${transactions.length} transaction${transactions.length === 1 ? "" : "s"}`}
          </p>

          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
          >
            Close
          </button>
        </footer>
      </section>
    </div>
  );
}
