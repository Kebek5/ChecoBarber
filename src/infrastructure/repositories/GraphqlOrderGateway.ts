import type { OrderGateway } from '@/application/ports/OrderGateway'
import type { Order, OrderConfirmation } from '@/domain/order/Order'
import type { GraphqlClient } from '@/infrastructure/graphql/client'
import { MUTATION_CREATE_ORDER } from '@/infrastructure/graphql/queries'

export class GraphqlOrderGateway implements OrderGateway {
  constructor(private readonly gql: GraphqlClient) {}

  async place(token: string, order: Order): Promise<OrderConfirmation> {
    const res = await this.gql<{ createOrder: OrderConfirmation }>(
      MUTATION_CREATE_ORDER,
      {
        // El cliente sale del token; solo viajan los renglones
        data: { lines: order.lines.map((l) => ({ idProduct: l.productId, amount: l.amount })) },
      },
      { token }
    )
    return res.createOrder
  }
}
