export type OrderStatus = 'PENDING' | 'IN_PROCESS' | 'COMPLETED'


export interface AdminOrderLine {
   id: string
   productId: string
   productName: string
   amount: number
   unitPrice: number
}

export interface AdminOrder {
   id: string
   date: string // 'YYYY-MM-DD', tal cual lo manda el backend
   total: number
   status: OrderStatus
   customer: { id: string; name: string; email: string; tel: string }
   lines: AdminOrderLine[]
}

export const ORDER_FLOW: readonly OrderStatus[] = ['PENDING', 'IN_PROCESS', 'COMPLETED']

export const isOrderStatus = (value: string): value is OrderStatus =>
   (ORDER_FLOW as readonly string[]).includes(value)

export const nextOrderStatus = (status: OrderStatus): OrderStatus | null =>
   ORDER_FLOW[ORDER_FLOW.indexOf(status) + 1] ?? null

export const lineSubtotal = (line: AdminOrderLine): number =>
   Math.round(line.amount * line.unitPrice * 100) / 100

export const orderUnits = (order: AdminOrder): number =>
   order.lines.reduce((sum, line) => sum + line.amount, 0)