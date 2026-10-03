import type { OrderStatus } from '@/domain/order'

const currency = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })
export const formatPrice = (amount: number): string => currency.format(amount)

// 'YYYY-MM-DD' se interpreta como medianoche UTC y en México mostraría un día antes
export const formatOrderDate = (iso: string): string =>
   new Date(`${iso}T00:00:00`).toLocaleDateString('es-MX')

export const orderStatusLabel: Record<OrderStatus, string> = {
   PENDING: 'Pendiente',
   IN_PROCESS: 'En proceso',
   COMPLETED: 'Completado',
}