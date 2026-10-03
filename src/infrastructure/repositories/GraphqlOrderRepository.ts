import type { OrderRepository } from '@/application/ports/OrderRepository'
import type { OrderRequest } from '@/domain/order'
import type { GraphqlClient } from '../graphql/client'
import type { OrderDTO } from '../graphql/dto'
import { MUTATION_CREATE_ORDER, QUERY_ORDER_BY_ID, QUERY_ORDERS } from '../graphql/queries'
import { toOrder, toOrderInput } from '../graphql/mappers'

export class GraphqlOrderRepository implements OrderRepository {
   constructor(private readonly gql: GraphqlClient) {}

   async createOrder(token: string, request: OrderRequest) {
      const data = await this.gql<{ createOrder: OrderDTO }>(
         MUTATION_CREATE_ORDER, { data: toOrderInput(request) }, { token })
      return toOrder(data.createOrder)
   }

   async getOrders(token: string) {
      const data = await this.gql<{ orders: OrderDTO[] }>(QUERY_ORDERS, {}, { token })
      return data.orders.map((o) => toOrder(o))
   }

   async getOrderById(token: string, id: string) {
      const data = await this.gql<{ order: OrderDTO | null }>(QUERY_ORDER_BY_ID, { id }, { token })
      return data.order ? toOrder(data.order) : null
   }
}