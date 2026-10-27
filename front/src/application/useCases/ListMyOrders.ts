import type { OrderGateway } from '@/application/ports/OrderGateway'
import type { MyOrder } from '@/domain/order/MyOrder'

export class ListMyOrders {
  constructor(private readonly orders: OrderGateway) {}

  async execute(token: string): Promise<MyOrder[]> {
    const orders = await this.orders.listMine(token)
    // Más recientes primero (el id crece con cada pedido)
    return [...orders].sort((a, b) => b.date.localeCompare(a.date) || Number(b.id) - Number(a.id))
  }
}
