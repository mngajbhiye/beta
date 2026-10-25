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