import type { Order, OrderConfirmation } from '@/domain/order/Order'

export interface OrderGateway {
  place(order: Order): Promise<OrderConfirmation>
}