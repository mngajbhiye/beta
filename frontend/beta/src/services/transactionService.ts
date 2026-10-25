import api from "./api";
import type { CustomerTransaction } from "../types/api";

export async function getCustomerTransactions(
  customerId: string,
): Promise<CustomerTransaction[]> {
  const response = await api.get<CustomerTransaction[]>(
    `/transactions/customers/${encodeURIComponent(customerId)}`,
  );

  return response.data;
}