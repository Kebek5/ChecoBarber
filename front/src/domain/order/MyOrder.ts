import type { DeliveryType, PaymentMethod } from './Payment'

export type MyOrderPaymentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'REFUNDED'
export type MyOrderStatus = 'PENDING' | 'IN_PROCESS' | 'COMPLETED'

export interface MyOrderLine {
   id: string
   amount: number
   unitPrice: number
   product: { id: string; name: string; img: string } | null
}

// Un pedido visto por el cliente que lo hizo ("Mis compras")
export interface MyOrder {
   id: string
   reference: string
   date: string // 'YYYY-MM-DD'
   total: number
   status: MyOrderStatus
   paymentStatus: MyOrderPaymentStatus
   paymentMethod: PaymentMethod
   deliveryType: DeliveryType
   address: string | null
   lines: MyOrderLine[]
}

export const PURCHASE_FILTERS = ['ALL', 'TO_PAY', 'IN_PROGRESS', 'COMPLETED', 'CLOSED'] as const
export type PurchaseFilter = (typeof PURCHASE_FILTERS)[number]

export const PURCHASE_FILTER_LABEL: Record<PurchaseFilter, string> = {
   ALL: 'Todas',
   TO_PAY: 'Por pagar',
   IN_PROGRESS: 'En camino',
   COMPLETED: 'Entregadas',
   CLOSED: 'Canceladas',
}

export const isPurchaseFilter = (value: string): value is PurchaseFilter =>
   (PURCHASE_FILTERS as readonly string[]).includes(value)

// Un pedido "por pagar" todavía puede pagarse (o es de cobro al recoger)
export const needsPayment = (o: MyOrder): boolean =>
   o.paymentStatus === 'PENDING' || o.paymentStatus === 'REJECTED'

export const isClosed = (o: MyOrder): boolean =>
   o.paymentStatus === 'CANCELLED' || o.paymentStatus === 'REFUNDED'

export function matchesFilter(o: MyOrder, filter: PurchaseFilter): boolean {
   switch (filter) {
      case 'TO_PAY':
         return needsPayment(o)
      case 'IN_PROGRESS':
         return o.paymentStatus === 'APPROVED' && o.status !== 'COMPLETED'
      case 'COMPLETED':
         return o.status === 'COMPLETED' && o.paymentStatus === 'APPROVED'
      case 'CLOSED':
         return isClosed(o)
      default:
         return true
   }
}

export const unitsOf = (o: MyOrder): number => o.lines.reduce((sum, l) => sum + l.amount, 0)

// Total gastado: solo pedidos pagados (no cancelados ni reembolsados)
export const totalSpent = (orders: MyOrder[]): number =>
   Math.round(orders.filter((o) => o.paymentStatus === 'APPROVED').reduce((sum, o) => sum + o.total, 0) * 100) / 100

// Texto de seguimiento para el cliente
export function progressLabel(o: MyOrder): string {
   if (o.paymentStatus === 'CANCELLED') return 'Cancelado'
   if (o.paymentStatus === 'REFUNDED') return 'Reembolsado'
   if (o.paymentStatus === 'REJECTED') return 'Pago rechazado'
   if (o.paymentStatus === 'PENDING') {
      return o.paymentMethod === 'TERMINAL' || o.paymentMethod === 'CASH' ? 'Pagas al recoger' : 'Pago pendiente'
   }
   if (o.status === 'COMPLETED') return o.deliveryType === 'PICKUP' ? 'Entregado en tienda' : 'Entregado'
   if (o.status === 'IN_PROCESS') return o.deliveryType === 'PICKUP' ? 'Listo para recoger' : 'En camino'
   return 'Pagado · preparando tu pedido'
}
