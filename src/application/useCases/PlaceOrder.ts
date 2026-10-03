import { assertValidOrderRequest, type Order, type OrderRequest } from '@/domain/order/Order.ts'
import type { OrderRepository } from '../ports/OrderRepository'

export class PlaceOrder {
   constructor(private orders: OrderRepository) {}

   async execute(token: string, request: OrderRequest): Promise<Order> {
      assertValidOrderRequest(request)
      return this.orders.createOrder(token, request)
   }
}