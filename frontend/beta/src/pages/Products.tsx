import { useEffect, useState } from "react";
import ProductForm from "../components/products/ProductForm";
import { createProduct, getProducts } from "../services/productService";
import type { Product, ProductInput } from "../types/api";

function formatCurrency(amount: number) {
  return amount.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    async function loadProducts() {
      try {
        setError("");
        const data = await getProducts();
        setProducts(data);
      } catch {
        setError("Failed to load products. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadProducts();
  }, []);

  async function handleCreateProduct(product: ProductInput) {
    const createdProduct = await createProduct(product);

    setProducts((current) => [createdProduct, ...current]);
  }

  return (
    <main className="mx-auto w-full max-w-7xl p-4 sm:p-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Products</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Manage your product catalogue and stock.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="shrink-0 rounded-md bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800"
        >
          + Add Product
        </button>
      </div>

      <div className="mb-4 text-sm text-neutral-500">
        {products.length} {products.length === 1 ? "product" : "products"}
      </div>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="ml-2 font-medium underline"
          >
            Retry
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="py-12 text-center text-sm text-neutral-500">
          Loading products...
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 px-4 py-12 text-center">
          <h2 className="font-medium text-neutral-900">No products yet</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Add your first product to get started.
          </p>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="mt-4 rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
          >
            Add Product
          </button>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-xl border border-neutral-200 bg-white md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50">
                <tr>
                  <th className="px-5 py-3 font-medium text-neutral-500">
                    Product
                  </th>
                  <th className="px-5 py-3 font-medium text-neutral-500">
                    Category
                  </th>
                  <th className="px-5 py-3 text-right font-medium text-neutral-500">
                    Purchase Price
                  </th>
                  <th className="px-5 py-3 text-right font-medium text-neutral-500">
                    Selling Price
                  </th>
                  <th className="px-5 py-3 text-right font-medium text-neutral-500">
                    Stock
                  </th>
                  <th className="px-5 py-3 font-medium text-neutral-500">
                    Unit
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-neutral-100">
                {products.map((product) => (
                  <tr
                    key={product.productId}
                    className="transition hover:bg-neutral-50"
                  >
                    <td className="px-5 py-3">
                      <p className="font-medium text-neutral-900">
                        {product.name}
                      </p>
                      <p className="mt-0.5 font-mono text-xs text-neutral-400">
                        {product.productId}
                      </p>
                    </td>

                    <td className="px-5 py-3 text-neutral-600">
                      {product.category}
                    </td>

                    <td className="px-5 py-3 text-right text-neutral-600">
                      {formatCurrency(product.purchasePrice)}
                    </td>

                    <td className="px-5 py-3 text-right font-medium text-neutral-900">
                      {formatCurrency(product.sellingPrice)}
                    </td>

                    <td className="px-5 py-3 text-right text-neutral-600">
                      {product.stockQuantity}
                    </td>

                    <td className="px-5 py-3 text-neutral-600">
                      {product.unit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {products.map((product) => (
              <article
                key={product.productId}
                className="rounded-xl border border-neutral-200 bg-white p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-semibold text-neutral-900">
                      {product.name}
                    </h2>
                    <p className="mt-1 text-sm text-neutral-500">
                      {product.category}
                    </p>
                  </div>

                  <span className="shrink-0 rounded-md bg-neutral-100 px-2 py-1 text-xs text-neutral-600">
                    {product.stockQuantity} {product.unit}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-neutral-100 pt-3">
                  <div>
                    <p className="text-xs text-neutral-500">Purchase Price</p>
                    <p className="mt-1 text-sm text-neutral-700">
                      {formatCurrency(product.purchasePrice)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-neutral-500">Selling Price</p>
                    <p className="mt-1 text-sm font-medium text-neutral-900">
                      {formatCurrency(product.sellingPrice)}
                    </p>
                  </div>
                </div>

                <p className="mt-3 break-all font-mono text-xs text-neutral-400">
                  ID: {product.productId}
                </p>
              </article>
            ))}
          </div>
        </>
      )}

      {showForm && (
        <ProductForm
          onClose={() => setShowForm(false)}
          onSubmit={handleCreateProduct}
        />
      )}
    </main>
  );
}
