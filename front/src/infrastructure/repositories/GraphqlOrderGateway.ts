import type { OrderGateway } from '@/application/ports/OrderGateway'
import type { Order, OrderConfirmation } from '@/domain/order/Order'
import type { GraphqlClient } from '@/infrastructure/graphql/client'
import type { MyOrder } from '@/domain/order/MyOrder'
import { MUTATION_CREATE_ORDER, QUERY_MY_ORDERS } from '@/infrastructure/graphql/queries'

export class GraphqlOrderGateway implements OrderGateway {
  constructor(private readonly gql: GraphqlClient) {}

  async place(token: string, order: Order): Promise<OrderConfirmation> {
    const res = await this.gql<{ createOrder: OrderConfirmation }>(
      MUTATION_CREATE_ORDER,
      {
        // El cliente sale del token; solo viajan los renglones
        data: {
          lines: order.lines.map((l) => ({ idProduct: l.productId, amount: l.amount })),
          paymentMethod: order.paymentMethod,
          deliveryType: order.deliveryType,
          address: order.deliveryType === 'SHIPPING' ? order.address : null,
        },
      },
      { token }
    )
    return res.createOrder
  }

  async listMine(token: string): Promise<MyOrder[]> {
    // Para un cliente, "orders" devuelve solo sus propios pedidos
    const res = await this.gql<{ orders: MyOrder[] }>(QUERY_MY_ORDERS, {}, { token })
    return res.orders
  }
}
