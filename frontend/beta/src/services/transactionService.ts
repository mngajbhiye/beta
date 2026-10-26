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

export interface SaleItemInput {
  productId: string;
  quantity: number;
  unitPrice?: number;
}

export interface SaleInput {
  customerId: string;
  type: "sale";
  amtExchanged: number;
  status: "completed";
  items: SaleItemInput[];
}

export interface ReturnItemInput {
  productId: string;
  quantity: number;
  amtExchanged: number;
}

export interface ReturnInput {
  customerId: string;
  items: ReturnItemInput[];
  reason?: string;
  amtExchanged: number;
}

export interface PaymentInput {
  customerId: string;
  amount: number;
  direction: "received" | "paid";
  method: "cash" | "upi" | "card" | "bank_transfer" | "other";
}

export async function getTransactions(): Promise<CustomerTransaction[]> {
  const response = await api.get("/transactions");
  const data = response.data;

  if (Array.isArray(data)) {
    return data as CustomerTransaction[];
  }

  if (Array.isArray(data?.transactions)) {
    return data.transactions as CustomerTransaction[];
  }

  return [];
}

export async function createSale(payload: SaleInput) {
  const response = await api.post("/transactions", payload);
  return response.data;
}

export async function createReturn(payload: ReturnInput) {
  const response = await api.post("/transactions/returns", payload);
  return response.data;
}

export async function createPayment(payload: PaymentInput) {
  const response = await api.post("/payments", payload);
  return response.data;
}