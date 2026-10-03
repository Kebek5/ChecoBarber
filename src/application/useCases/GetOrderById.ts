import type { OrderRepository } from "../ports/OrderRepository";

export class GetOrderById {
   constructor(private orders: OrderRepository) {}
   execute(token: string, id: string){return this.orders.getOrderById(token, id) }
}