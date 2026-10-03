import type { Order } from "@/domain/order/Order";
import type { OrderRequest } from "@/domain/order/Order";

export interface OrderRepository {
   getOrders(token: string): Promise<Order[]>,
   getOrderById(token: string, id: string): Promise<Order | null>
   createOrder(token: string, request: OrderRequest): Promise<Order>
}