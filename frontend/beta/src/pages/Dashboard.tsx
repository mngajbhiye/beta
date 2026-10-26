import { useCallback, useEffect, useMemo, useState } from "react";
import { getCustomers } from "../services/customerService";
import { getTransactions } from "../services/transactionService";
import type { Customer, CustomerTransaction } from "../types/api";

interface CustomerBalance {
  customer: Customer;
  totalAmount: number;
  settledAmount: number;
  pendingAmount: number;
}

const cardClass = "rounded-xl border border-neutral-200 bg-white p-5";

function money(value: number) {
  return value.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });
}

function getTransactionAmount(transaction: CustomerTransaction) {
  return transaction.amtExchanged ?? 0;
}

function getPaymentAmount(transaction: CustomerTransaction) {
  const payment = transaction as CustomerTransaction & {
    amount?: number;
  };

  return payment.amtExchanged ?? payment.amount ?? 0;
}

function getCustomerBalances(
  customers: Customer[],
  transactions: CustomerTransaction[],
): CustomerBalance[] {
  return customers
    .map((customer) => {
      const customerTransactions = transactions.filter(
        (transaction) => transaction.customerId === customer.customerId,
      );

      const totalSales = customerTransactions
        .filter((transaction) => transaction.type === "sale")
        .reduce((sum, transaction) => sum + (transaction.totalAmount ?? 0), 0);

      const totalReturns = customerTransactions
        .filter((transaction) => transaction.type === "return")
        .reduce((sum, transaction) => sum + (transaction.totalAmount ?? 0), 0);

      const salesReceived = customerTransactions
        .filter((transaction) => transaction.type === "sale")
        .reduce(
          (sum, transaction) => sum + getTransactionAmount(transaction),
          0,
        );

      const paymentsReceived = customerTransactions
        .filter(
          (transaction) =>
            transaction.type === "payment" &&
            transaction.direction === "received",
        )
        .reduce((sum, transaction) => sum + getPaymentAmount(transaction), 0);

      const refundsPaid = customerTransactions
        .filter((transaction) => transaction.type === "return")
        .reduce(
          (sum, transaction) => sum + getTransactionAmount(transaction),
          0,
        );

      const otherPaymentsPaid = customerTransactions
        .filter(
          (transaction) =>
            transaction.type === "payment" && transaction.direction === "paid",
        )
        .reduce((sum, transaction) => sum + getPaymentAmount(transaction), 0);

      const totalAmount = totalSales - totalReturns;

      const settledAmount =
        salesReceived + paymentsReceived - refundsPaid - otherPaymentsPaid;

      const pendingAmount = totalAmount - settledAmount;

      return {
        customer,
        totalAmount,
        settledAmount,
        pendingAmount,
        hasTransactions: customerTransactions.length > 0,
      };
    })
    .filter((balance) => balance.hasTransactions)
    .map(({ hasTransactions, ...balance }) => balance);
}

function SummaryCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className={cardClass}>
      <p className="text-sm font-medium text-neutral-500">{title}</p>
      <p className="mt-3 break-words text-2xl font-semibold text-neutral-900">
        {value}
      </p>
      <p className="mt-2 text-xs text-neutral-500">{description}</p>
    </div>
  );
}

export default function Dashboard() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [transactions, setTransactions] = useState<CustomerTransaction[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [customerData, transactionData] = await Promise.all([
        getCustomers(),
        getTransactions(),
      ]);

      setCustomers(customerData);
      setTransactions(transactionData);
    } catch {
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Include only customers with at least one transaction.
  const balances = useMemo(
    () => getCustomerBalances(customers, transactions),
    [customers, transactions],
  );

  // Calculate overall totals using only customers with transactions.
  const summary = useMemo(
    () =>
      balances.reduce(
        (totals, balance) => ({
          totalAmount: totals.totalAmount + balance.totalAmount,
          settledAmount: totals.settledAmount + balance.settledAmount,
          pendingAmount: totals.pendingAmount + balance.pendingAmount,
        }),
        {
          totalAmount: 0,
          settledAmount: 0,
          pendingAmount: 0,
        },
      ),
    [balances],
  );

  // Search and sort customers by highest pending amount.
  const filteredBalances = useMemo(() => {
    const query = search.trim().toLowerCase();

    return balances
      .filter(({ customer }) => {
        const searchableText = [
          customer.customerId,
          customer.name,
          customer.phone,
          customer.address,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchableText.includes(query);
      })
      .sort((a, b) => b.pendingAmount - a.pendingAmount);
  }, [balances, search]);

  // Totals for the currently filtered customers.
  const filteredSummary = useMemo(
    () =>
      filteredBalances.reduce(
        (totals, balance) => ({
          totalAmount: totals.totalAmount + balance.totalAmount,
          settledAmount: totals.settledAmount + balance.settledAmount,
          pendingAmount: totals.pendingAmount + balance.pendingAmount,
        }),
        {
          totalAmount: 0,
          settledAmount: 0,
          pendingAmount: 0,
        },
      ),
    [filteredBalances],
  );

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-7xl p-4 sm:p-6">
        <h1 className="text-2xl font-semibold text-neutral-900">Dashboard</h1>
        <p className="mt-6 text-sm text-neutral-500">Loading dashboard...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl p-4 sm:p-6">
      {/* Page header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Dashboard</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Overview of your business and customer balances.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadData()}
          className="self-start rounded-md border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 sm:self-auto"
        >
          Refresh
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div
          role="alert"
          className="mb-6 flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => void loadData()}
            className="self-start font-medium underline sm:self-auto"
          >
            Retry
          </button>
        </div>
      )}

      {/* Overall summary */}
      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-neutral-900">
          Overall Summary
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Total Customers"
            value={balances.length.toLocaleString("en-IN")}
            description="Customers with at least one transaction"
          />

          <SummaryCard
            title="Total Amount"
            value={money(summary.totalAmount)}
            description="Sales minus returned goods"
          />

          <SummaryCard
            title="Amount Settled"
            value={money(summary.settledAmount)}
            description="Net payments and refunds"
          />

          <SummaryCard
            title="Amount Pending"
            value={money(summary.pendingAmount)}
            description="Outstanding customer balances"
          />
        </div>
      </section>

      {/* Customer balances */}
      <section className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-neutral-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <h2 className="font-semibold text-neutral-900">
              Customer Balances
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              {filteredBalances.length} of {balances.length} customers
            </p>
          </div>

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search customers..."
            aria-label="Search customers"
            className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-500 sm:max-w-xs"
          />
        </div>

        {filteredBalances.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-medium text-neutral-700">
              {balances.length === 0
                ? "No customer transactions yet"
                : "No customers found"}
            </p>
            <p className="mt-1 text-sm text-neutral-500">
              {balances.length === 0
                ? "Customers will appear here after their first transaction."
                : "Try a different search."}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-neutral-100 bg-neutral-50">
                  <tr>
                    <th className="px-5 py-3 font-medium text-neutral-500">
                      Customer
                    </th>
                    <th className="px-5 py-3 font-medium text-neutral-500">
                      Phone
                    </th>
                    <th className="px-5 py-3 text-right font-medium text-neutral-500">
                      Total Amount
                    </th>
                    <th className="px-5 py-3 text-right font-medium text-neutral-500">
                      Settled
                    </th>
                    <th className="px-5 py-3 text-right font-medium text-neutral-500">
                      Pending
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-neutral-100">
                  {filteredBalances.map((balance) => (
                    <tr
                      key={balance.customer.customerId}
                      className="hover:bg-neutral-50"
                    >
                      <td className="px-5 py-4">
                        <p className="font-medium text-neutral-900">
                          {balance.customer.name}
                        </p>
                        <p className="mt-1 font-mono text-xs text-neutral-400">
                          {balance.customer.customerId}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-neutral-600">
                        {balance.customer.phone || "—"}
                      </td>

                      <td className="px-5 py-4 text-right text-neutral-700">
                        {money(balance.totalAmount)}
                      </td>

                      <td className="px-5 py-4 text-right text-neutral-700">
                        {money(balance.settledAmount)}
                      </td>

                      <td
                        className={`px-5 py-4 text-right font-semibold ${
                          balance.pendingAmount > 0
                            ? "text-amber-700"
                            : balance.pendingAmount < 0
                              ? "text-blue-700"
                              : "text-neutral-700"
                        }`}
                      >
                        {money(balance.pendingAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>

                <tfoot className="border-t border-neutral-200 bg-neutral-50">
                  <tr>
                    <td
                      colSpan={2}
                      className="px-5 py-4 font-semibold text-neutral-900"
                    >
                      Filtered Total
                    </td>

                    <td className="px-5 py-4 text-right font-semibold text-neutral-900">
                      {money(filteredSummary.totalAmount)}
                    </td>

                    <td className="px-5 py-4 text-right font-semibold text-neutral-900">
                      {money(filteredSummary.settledAmount)}
                    </td>

                    <td className="px-5 py-4 text-right font-semibold text-neutral-900">
                      {money(filteredSummary.pendingAmount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="space-y-3 p-3 md:hidden">
              {filteredBalances.map((balance) => (
                <article
                  key={balance.customer.customerId}
                  className="rounded-lg border border-neutral-200 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words font-medium text-neutral-900">
                        {balance.customer.name}
                      </p>
                      <p className="mt-1 text-sm text-neutral-500">
                        {balance.customer.phone || "No phone number"}
                      </p>
                      <p className="mt-1 break-all font-mono text-xs text-neutral-400">
                        {balance.customer.customerId}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-xs text-neutral-500">Pending</p>
                      <p
                        className={`mt-1 font-semibold ${
                          balance.pendingAmount > 0
                            ? "text-amber-700"
                            : balance.pendingAmount < 0
                              ? "text-blue-700"
                              : "text-neutral-900"
                        }`}
                      >
                        {money(balance.pendingAmount)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 border-t border-neutral-100 pt-3">
                    <div>
                      <p className="text-xs text-neutral-500">Total Amount</p>
                      <p className="mt-1 font-medium text-neutral-900">
                        {money(balance.totalAmount)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-neutral-500">Settled</p>
                      <p className="mt-1 font-medium text-neutral-900">
                        {money(balance.settledAmount)}
                      </p>
                    </div>
                  </div>
                </article>
              ))}

              {/* Filtered totals */}
              <div className="rounded-lg bg-neutral-50 p-4">
                <p className="font-semibold text-neutral-900">
                  Filtered Totals
                </p>

                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="text-neutral-500">Total amount</span>
                    <span className="font-medium">
                      {money(filteredSummary.totalAmount)}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-neutral-500">Settled</span>
                    <span className="font-medium">
                      {money(filteredSummary.settledAmount)}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-neutral-500">Pending</span>
                    <span className="font-semibold">
                      {money(filteredSummary.pendingAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
