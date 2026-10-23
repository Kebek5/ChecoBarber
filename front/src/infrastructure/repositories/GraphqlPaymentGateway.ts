import type { GraphqlClient } from '@/infrastructure/graphql/client'
import { MUTATION_CONFIRM_PAYMENT, MUTATION_START_PAYMENT } from '@/infrastructure/graphql/queries'

export type PaymentMethod = 'MERCADOPAGO' | 'PAYPAL'

export class GraphqlPaymentGateway {
  constructor(private readonly gql: GraphqlClient) {}

  async start(token: string, orderId: string, method: PaymentMethod): Promise<string> {
    const res = await this.gql<{ startPayment: { url: string } }>(
      MUTATION_START_PAYMENT, { orderId, method }, { token })
    return res.startPayment.url
  }

  async confirm(token: string, orderId: string, ref: string) {
    const res = await this.gql<{ confirmPayment: { orderId: string; paid: boolean; status: string } }>(
      MUTATION_CONFIRM_PAYMENT, { orderId, ref: ref || null }, { token })
    return res.confirmPayment
  }
}