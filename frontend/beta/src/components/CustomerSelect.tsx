import { useMemo, useState } from "react";
import type { Customer } from "../types/api";

interface CustomerSelectProps {
  customers: Customer[];
  value: string;
  onChange: (customerId: string) => void;
  required?: boolean;
}

export default function CustomerSelect({
  customers,
  value,
  onChange,
  required = true,
}: CustomerSelectProps) {
  const [search, setSearch] = useState("");

  const selectedCustomer = customers.find(
    (customer) => customer.customerId === value,
  );

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(query) ||
        customer.phone.toLowerCase().includes(query),
    );
  }, [customers, search]);

  return (
    <div className="space-y-2">
      <label
        htmlFor="customer-search"
        className="block text-sm text-left font-medium text-neutral-700"
      >
        Customer
      </label>

      <input
        id="customer-search"
        type="text"
        value={search || selectedCustomer?.name || ""}
        onChange={(event) => {
          setSearch(event.target.value);
          if (value) onChange("");
        }}
        placeholder="Search by name or phone..."
        required={required && !value}
        autoComplete="off"
        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />

      {selectedCustomer && !search && (
        <p className="text-xs text-green-700">
          Selected: {selectedCustomer.name} — {selectedCustomer.phone}
        </p>
      )}

      <div className="max-h-48 overflow-y-auto rounded-lg border border-neutral-200 bg-white">
        {filteredCustomers.length > 0 ? (
          filteredCustomers.map((customer) => {
            const isSelected = customer.customerId === value;

            return (
              <button
                key={customer.customerId}
                type="button"
                onClick={() => {
                  onChange(customer.customerId);
                  setSearch("");
                }}
                className={`flex w-full items-center justify-between gap-3 border-b border-neutral-100 px-3 py-2 text-left last:border-b-0 hover:bg-neutral-50 ${
                  isSelected ? "bg-blue-50" : ""
                }`}
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-neutral-800">
                    {customer.name}
                  </span>
                  <span className="block text-xs text-neutral-500">
                    {customer.phone}
                  </span>
                </span>

                {isSelected && (
                  <span className="shrink-0 text-xs font-medium text-blue-600">
                    Selected
                  </span>
                )}
              </button>
            );
          })
        ) : (
          <p className="px-3 py-4 text-center text-sm text-neutral-500">
            No customers found.
          </p>
        )}
      </div>

      <p className="text-xs text-neutral-500">
        {filteredCustomers.length} customer
        {filteredCustomers.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
}
