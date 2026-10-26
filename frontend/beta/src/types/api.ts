export interface Customer {
  customerId: string
  name: string
  phone: string
  address?: string | null
}

export interface TransactionItem {
  itemId: string;
  transactionId: string;
  quantity: number;
  subtotal: number;
  productId: string;
  unitPrice: number;
  productName: string;
}

export type TransactionType = "sale" | "return" | "payment";

export interface CustomerTransaction {
  transactionId: string;
  customerId: string;
  type: TransactionType;
  status: string;
  dateTime: string;

  // Sales and returns
  totalAmount?: number;
  reason?: string;

  // Payments and returns
  method?: string;
  direction?: string;
  amtExchanged?: number;

  items: TransactionItem[];
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
  items: TransactionItem[];
}