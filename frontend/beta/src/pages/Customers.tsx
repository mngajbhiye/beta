import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import CustomerForm from "../components/customers/CustomerForm";
import { getCustomers } from "../services/customerService";
import type { Customer } from "../types/api";
import CustomerTransactions from "../components/customers/CustomerTransactions";

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );

  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getCustomers();
      setCustomers(data);
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
    void loadCustomers();
  }, [loadCustomers]);

  useEffect(() => {
    async function loadCustomers() {
      try {
        setLoading(true);
        setError("");

        const data = await getCustomers();
        setCustomers(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load customers.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return customers;

    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(query) ||
        customer.phone.toLowerCase().includes(query),
    );
  }, [customers, search]);

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

        {/* Summary */}
        <section className="mt-8 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-neutral-500">
            Total customers
          </p>

          <p className="mt-2 text-3xl font-bold text-neutral-900">
            {loading ? "—" : customers.length}
          </p>
        </section>

        {/* Search */}
        <section className="mt-6">
          <label htmlFor="customer-search" className="sr-only">
            Search customers
          </label>

          <input
            id="customer-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by customer name or phone..."
            className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
          />
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

              <p className="mt-2 text-sm text-red-700">
                Check that your FastAPI server is running and the API URL is
                correct.
              </p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-neutral-300 bg-white px-6 py-16 text-center">
              <h2 className="text-lg font-semibold text-neutral-800">
                {search ? "No matching customers" : "No customers yet"}
              </h2>

              <p className="mt-2 text-sm text-neutral-500">
                {search
                  ? "Try searching with a different name or phone number."
                  : "Customers will appear here once they are added."}
              </p>
            </div>
          ) : (
            <>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-neutral-700">
                  Customer list
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
                      <th className="px-6 py-2 font-medium">Name</th>
                      <th className="px-6 py-2 font-medium">Phone</th>
                      <th className="px-6 py-2 font-medium">Address</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-500">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-neutral-100">
                    {filteredCustomers.map((customer) => (
                      <tr
                        key={customer.customerId}
                        className="transition hover:bg-neutral-50"
                      >
                        <td className="px-6 py-2 font-medium text-neutral-900">
                          {customer.name}
                        </td>

                        <td className="px-6 py-2 text-neutral-600">
                          {customer.phone}
                        </td>

                        <td className="px-6 py-2 text-neutral-600">
                          {customer.address || "—"}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedCustomer(customer)}
                            className="rounded-md border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
                          >
                            View history
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="space-y-3 md:hidden">
                {filteredCustomers.map((customer) => (
                  <article
                    key={customer.customerId}
                    className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm"
                  >
                    <h3 className="font-semibold text-neutral-900">
                      {customer.name}
                    </h3>
                    <p className="mt-1 text-sm text-neutral-600">
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
                      className="mt-3 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
                    >
                      View history
                    </button>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
      {showAddForm && (
        <CustomerForm
          onCancel={() => setShowAddForm(false)}
          onCreated={() => {
            setShowAddForm(false);
            void loadCustomers();
          }}
        />
      )}
      {selectedCustomer && (
        <CustomerTransactions
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
        />
      )}
    </main>
  );
}
