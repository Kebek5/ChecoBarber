import type { Customer } from './Customer'
import type { DeliveryType, PaymentMethod } from './Payment'

export interface OrderLine {
  productId: string
  amount: number
}

export interface Order {
  customer: Customer
  lines: OrderLine[]
  paymentMethod: PaymentMethod
  deliveryType: DeliveryType
  address?: string
}

export interface OrderConfirmation {
  id: string
  date: string
  total: number
  status: string
  reference: string
  paymentMethod: PaymentMethod
  paymentStatus: string
  deliveryType: DeliveryType
}