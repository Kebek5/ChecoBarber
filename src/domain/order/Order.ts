import type { Customer } from './Customer'

export interface OrderLine {
  productId: string
  amount: number
}

export interface Order {
  customer: Customer
  lines: OrderLine[]
}

export interface OrderConfirmation {
  id: string
  date: string
  total: number
  status: string
}