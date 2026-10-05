import type { Order, OrderConfirmation } from '@/domain/order/Order'

export interface OrderGateway {
  place(token: string, order: Order): Promise<OrderConfirmation>
}