import api from './api'
import type { Customer } from '../types/api'

export interface CreateCustomerInput {
  name: string
  phone: string
  address?: string
}

interface CustomersResponse {
  customers: Customer[]
}

export async function getCustomers(): Promise<Customer[]> {
  const response = await api.get<CustomersResponse>('/list-customers')
  return response.data.customers
}


export async function createCustomer(
  data: CreateCustomerInput,
): Promise<Customer> {
  const response = await api.post<Customer>('/customer', data)
  return response.data
}
