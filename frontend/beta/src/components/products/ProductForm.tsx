import { useState, type FormEvent } from "react";
import type { ProductInput } from "../../types/api";

interface ProductFormProps {
  onClose: () => void;
  onSubmit: (product: ProductInput) => Promise<void>;
}

const initialForm = {
  name: "",
  category: "",
  purchasePrice: "",
  sellingPrice: "",
  stockQuantity: "",
  unit: "",
};

export default function ProductForm({ onClose, onSubmit }: ProductFormProps) {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const product: ProductInput = {
      name: form.name.trim(),
      category: form.category.trim(),
      purchasePrice: Number(form.purchasePrice),
      sellingPrice: Number(form.sellingPrice),
      stockQuantity: Number(form.stockQuantity),
      unit: form.unit.trim(),
    };

    if (
      !product.name ||
      !product.category ||
      !product.unit ||
      !Number.isFinite(product.purchasePrice) ||
      !Number.isFinite(product.sellingPrice) ||
      !Number.isFinite(product.stockQuantity) ||
      product.purchasePrice < 0 ||
      product.sellingPrice < 0 ||
      product.stockQuantity < 0
    ) {
      setError("Please enter valid product details.");
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(product);
      onClose();
    } catch {
      setError("Failed to add product. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputClass =
    "mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm outline-none transition focus:border-neutral-500 focus:ring-1 focus:ring-neutral-300";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-form-title"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-5 shadow-xl sm:p-6"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2
            id="product-form-title"
            className="text-lg font-semibold text-neutral-900"
          >
            Add Product
          </h2>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close"
            className="rounded-md px-2 py-1 text-xl text-neutral-500 hover:bg-neutral-100"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="text-sm font-medium text-neutral-700"
            >
              Product Name
            </label>
            <input
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              maxLength={150}
              required
              autoFocus
              className={inputClass}
              placeholder="e.g. Coffee"
            />
          </div>

          <div>
            <label
              htmlFor="category"
              className="text-sm font-medium text-neutral-700"
            >
              Category
            </label>
            <input
              id="category"
              name="category"
              value={form.category}
              onChange={handleChange}
              maxLength={100}
              required
              className={inputClass}
              placeholder="e.g. Grocery"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="purchasePrice"
                className="text-sm font-medium text-neutral-700"
              >
                Purchase Price (₹)
              </label>
              <input
                id="purchasePrice"
                name="purchasePrice"
                type="number"
                value={form.purchasePrice}
                onChange={handleChange}
                min="0"
                step="any"
                required
                className={inputClass}
                placeholder="0.00"
              />
            </div>

            <div>
              <label
                htmlFor="sellingPrice"
                className="text-sm font-medium text-neutral-700"
              >
                Selling Price (₹)
              </label>
              <input
                id="sellingPrice"
                name="sellingPrice"
                type="number"
                value={form.sellingPrice}
                onChange={handleChange}
                min="0"
                step="any"
                required
                className={inputClass}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="stockQuantity"
                className="text-sm font-medium text-neutral-700"
              >
                Stock Quantity
              </label>
              <input
                id="stockQuantity"
                name="stockQuantity"
                type="number"
                value={form.stockQuantity}
                onChange={handleChange}
                min="0"
                step="any"
                required
                className={inputClass}
                placeholder="0"
              />
            </div>

            <div>
              <label
                htmlFor="unit"
                className="text-sm font-medium text-neutral-700"
              >
                Unit
              </label>
              <input
                id="unit"
                name="unit"
                value={form.unit}
                onChange={handleChange}
                maxLength={30}
                required
                className={inputClass}
                placeholder="e.g. kg, bag, litre"
              />
            </div>
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 border-t border-neutral-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-md border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Adding..." : "Add Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
