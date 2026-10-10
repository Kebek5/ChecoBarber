import type { OrderGateway } from '@/application/ports/OrderGateway'
import type { Order, OrderConfirmation } from '@/domain/order/Order'

export class PlaceOrder {
  constructor(private readonly orders: OrderGateway) {}

  async execute(token: string, order: Order): Promise<OrderConfirmation> {
    if (!token || !order.customer.id) {
      throw new Error('Debes iniciar sesión para finalizar la compra.')
    }
    if (order.lines.length === 0) {
      throw new Error('El pedido debe tener al menos un producto.')
    }
    if (order.lines.some((line) => !Number.isInteger(line.amount) || line.amount <= 0)) {
      throw new Error('La cantidad de un producto no es válida.')
    }
    if (order.deliveryType === 'SHIPPING' && !order.address?.trim()) {
      throw new Error('Escribe la dirección de entrega.')
    }
    if ((order.paymentMethod === 'TERMINAL' || order.paymentMethod === 'CASH') && order.deliveryType !== 'PICKUP') {
      throw new Error('El pago en terminal o en efectivo solo está disponible al recoger en tienda.')
    }

    return this.orders.place(token, order)
  }
}