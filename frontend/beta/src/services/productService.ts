import api from "./api";
import type { Product, ProductInput } from "../types/api";

interface ProductsResponse {
  products: Product[];
}

export async function getProducts(): Promise<Product[]> {
  const response = await api.get<ProductsResponse>("/products");
  return response.data.products;
}

export async function createProduct(
  product: ProductInput,
): Promise<Product> {
  const response = await api.post<Product>("/product", product);
  return response.data;
}