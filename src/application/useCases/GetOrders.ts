import type { OrderRepository } from "../ports/OrderRepository";

export class GetOrders {
   constructor(private orders: OrderRepository) {}
   execute(token: string){return this.orders.getOrders(token) }
}