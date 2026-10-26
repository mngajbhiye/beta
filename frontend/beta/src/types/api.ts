export interface Customer {
  customerId: string;
  name: string;
  phone: string;
  address?: string | null;
}

export interface Product {
  productId: string;
  name: string;
  category: string;
  purchasePrice: number;
  sellingPrice: number;
  stockQuantity: number;
  unit: string;
}

export type ProductInput = Omit<Product, "productId">;

export type TransactionType = "sale" | "return" | "payment" | "purchase";

export interface TransactionItem {
  itemId?: string;
  transactionId?: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal?: number;
}

export interface CustomerTransaction {
  transactionId: string;
  customerId: string;
  customerName?: string;
  phone?: string;
  type: TransactionType;
  status: string;
  dateTime: string;
  totalAmount?: number;
  amtExchanged?: number;
  direction?: "received" | "paid";
  method?: string;
  reason?: string;
  items?: TransactionItem[];
}