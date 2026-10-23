import { InvalidInputError } from '@/application/errors'
import type { AdminOrderGateway } from '@/application/ports/AdminGateway'
import { nextOrderStatus, type AdminOrder, type OrderStatus } from '@/domain/order/AdminOrder'

export class ListAdminOrders {
   constructor(private readonly orders: AdminOrderGateway) {}
   execute(token: string): Promise<AdminOrder[]> {
      return this.orders.listOrders(token)
   }
}

export class GetAdminOrder {
   constructor(private readonly orders: AdminOrderGateway) {}
   execute(token: string, id: string): Promise<AdminOrder | null> {
      return this.orders.findOrder(token, id)
   }
}

export class UpdateOrderStatus {
   constructor(private readonly orders: AdminOrderGateway) {}

   async execute(token: string, id: string, status: OrderStatus): Promise<AdminOrder> {
      const order = await this.orders.findOrder(token, id)
      if (!order) throw new InvalidInputError('El pedido no existe.')

      if (status !== nextOrderStatus(order.status)) {
         throw new InvalidInputError('El pedido no puede pasar a ese estado.')
      }
      const updated = await this.orders.updateOrderStatus(token, id, status)
      if (!updated) throw new InvalidInputError('El pedido no existe.')
      return updated
   }
}