import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import CustomerForm from "../components/customers/CustomerForms";
import CustomerTransactions from "../components/customers/CustomerTransactions";
import { getCustomers } from "../services/customerService";
import { getTransactions } from "../services/transactionService";
import type { Customer, CustomerTransaction } from "../types/api";

type CustomerFilter = "all" | "active";

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [transactions, setTransactions] = useState<CustomerTransaction[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<CustomerFilter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [customerData, transactionData] = await Promise.all([
        getCustomers(),
        getTransactions(),
      ]);

      setCustomers(customerData);
      setTransactions(transactionData);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const detail = error.response?.data?.detail;

        setError(
          typeof detail === "string"
            ? detail
            : error.message || "Failed to load customers.",
        );
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Identify customers who have at least one transaction.
  const activeCustomerIds = useMemo(() => {
    return new Set(transactions.map((transaction) => transaction.customerId));
  }, [transactions]);

  const activeCustomerCount = useMemo(
    () =>
      customers.filter((customer) => activeCustomerIds.has(customer.customerId))
        .length,
    [customers, activeCustomerIds],
  );

  // Apply the selected filter and search query.
  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return customers.filter((customer) => {
      const isActive = activeCustomerIds.has(customer.customerId);

      if (filter === "active" && !isActive) {
        return false;
      }

      const searchableText = [
        customer.name,
        customer.phone,
        customer.address,
        customer.customerId,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [customers, activeCustomerIds, filter, search]);

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Page heading */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
              Customers
            </h1>

            <p className="mt-2 text-sm text-neutral-500">
              Manage your customers and their information.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-700"
          >
            + Add Customer
          </button>
        </div>

        {/* Summary cards */}
        <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-neutral-500">
              Total customers
            </p>

            <p className="mt-2 text-3xl font-bold text-neutral-900">
              {loading ? "—" : customers.length.toLocaleString("en-IN")}
            </p>

            <p className="mt-1 text-xs text-neutral-500">
              All registered customers
            </p>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-neutral-500">
              Active customers
            </p>

            <p className="mt-2 text-3xl font-bold text-emerald-700">
              {loading ? "—" : activeCustomerCount.toLocaleString("en-IN")}
            </p>

            <p className="mt-1 text-xs text-neutral-500">
              Customers with at least one transaction
            </p>
          </div>
        </section>

        {/* Search and filters */}
        <section className="mt-6 rounded-xl border border-neutral-200 bg-white p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Search */}
            <div className="w-full sm:max-w-md">
              <label htmlFor="customer-search" className="sr-only">
                Search customers
              </label>

              <input
                id="customer-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name, phone, or ID..."
                className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
              />
            </div>

            {/* Customer filter */}
            <div
              className="flex w-full rounded-lg border border-neutral-200 bg-neutral-50 p-1 sm:w-auto"
              role="group"
              aria-label="Filter customers"
            >
              <button
                type="button"
                onClick={() => setFilter("all")}
                aria-pressed={filter === "all"}
                className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition sm:flex-none ${
                  filter === "all"
                    ? "bg-white text-neutral-900 shadow-sm ring-1 ring-neutral-200"
                    : "text-neutral-500 hover:text-neutral-900"
                }`}
              >
                All
                <span className="ml-2 text-xs">{customers.length}</span>
              </button>

              <button
                type="button"
                onClick={() => setFilter("active")}
                aria-pressed={filter === "active"}
                className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition sm:flex-none ${
                  filter === "active"
                    ? "bg-white text-emerald-700 shadow-sm ring-1 ring-neutral-200"
                    : "text-neutral-500 hover:text-neutral-900"
                }`}
              >
                Active
                <span className="ml-2 text-xs">{activeCustomerCount}</span>
              </button>
            </div>
          </div>
        </section>

        {/* Customer list */}
        <section className="mt-6">
          {loading ? (
            <div className="rounded-xl border border-neutral-200 bg-white p-10 text-center text-sm text-neutral-500">
              Loading customers...
            </div>
          ) : error ? (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-5"
            >
              <p className="font-semibold text-red-800">
                Unable to load customers
              </p>

              <p className="mt-2 break-words text-sm text-red-700">{error}</p>

              <button
                type="button"
                onClick={() => void loadData()}
                className="mt-4 rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-800 hover:bg-red-100"
              >
                Retry
              </button>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-neutral-300 bg-white px-6 py-16 text-center">
              <h2 className="text-lg font-semibold text-neutral-800">
                {search
                  ? "No matching customers"
                  : filter === "active"
                    ? "No active customers"
                    : "No customers yet"}
              </h2>

              <p className="mt-2 text-sm text-neutral-500">
                {search
                  ? "Try a different name, phone number, or customer ID."
                  : filter === "active"
                    ? "Customers will appear here after their first transaction."
                    : "Customers will appear here once they are added."}
              </p>

              {filter === "active" && search === "" && (
                <button
                  type="button"
                  onClick={() => setFilter("all")}
                  className="mt-4 text-sm font-medium text-neutral-900 underline underline-offset-4"
                >
                  View all customers
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-neutral-700">
                  {filter === "active" ? "Active customers" : "Customer list"}
                </h2>

                <span className="text-sm text-neutral-500">
                  {filteredCustomers.length}{" "}
                  {filteredCustomers.length === 1 ? "customer" : "customers"}
                </span>
              </div>

              {/* Desktop table */}
              <div className="hidden overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm md:block">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-500">
                    <tr>
                      <th className="px-6 py-3 font-medium">Name</th>
                      <th className="px-6 py-3 font-medium">Phone</th>
                      <th className="px-6 py-3 font-medium">Address</th>
                      <th className="px-6 py-3 font-medium">Status</th>
                      <th className="px-6 py-3 text-right font-medium">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-neutral-100">
                    {filteredCustomers.map((customer) => {
                      const isActive = activeCustomerIds.has(
                        customer.customerId,
                      );

                      return (
                        <tr
                          key={customer.customerId}
                          className="transition hover:bg-neutral-50"
                        >
                          <td className="px-6 py-4 font-medium text-neutral-900">
                            {customer.name}
                          </td>

                          <td className="px-6 py-4 text-neutral-600">
                            {customer.phone}
                          </td>

                          <td className="px-6 py-4 text-neutral-600">
                            {customer.address || "—"}
                          </td>

                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                                isActive
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-neutral-100 text-neutral-600"
                              }`}
                            >
                              {isActive ? "Active" : "Inactive"}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedCustomer(customer)}
                              className="rounded-md border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
                            >
                              Details
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="space-y-3 md:hidden">
                {filteredCustomers.map((customer) => {
                  const isActive = activeCustomerIds.has(customer.customerId);

                  return (
                    <article
                      key={customer.customerId}
                      className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="break-words font-semibold text-neutral-900">
                          {customer.name}
                        </h3>

                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                            isActive
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-neutral-100 text-neutral-600"
                          }`}
                        >
                          {isActive ? "Active" : "Inactive"}
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-neutral-600">
                        {customer.phone}
                      </p>

                      {customer.address && (
                        <p className="mt-1 text-sm text-neutral-500">
                          {customer.address}
                        </p>
                      )}

                      <button
                        type="button"
                        onClick={() => setSelectedCustomer(customer)}
                        className="mt-3 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
                      >
                        Details
                      </button>
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </section>
      </div>

      {/* Add customer modal */}
      {showAddForm && (
        <CustomerForm
          onCancel={() => setShowAddForm(false)}
          onCreated={() => {
            setShowAddForm(false);
            void loadData();
          }}
        />
      )}

      {/* Customer transaction history */}
      {selectedCustomer && (
        <CustomerTransactions
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
        />
      )}
    </main>
  );
}
