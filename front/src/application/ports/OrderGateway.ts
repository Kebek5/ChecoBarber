import type { MyOrder } from '@/domain/order/MyOrder'
import type { Order, OrderConfirmation } from '@/domain/order/Order'

export interface OrderGateway {
  place(token: string, order: Order): Promise<OrderConfirmation>
  listMine(token: string): Promise<MyOrder[]>
}
