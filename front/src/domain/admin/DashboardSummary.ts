import type { User } from '@/domain/auth/User'
import type { Product } from '@/domain/catalog/Product'
import { isUpcoming, type Appointment } from '@/domain/appointment/Appointment'
import type { AdminOrder } from '@/domain/order/AdminOrder'

export const LOW_STOCK_THRESHOLD = 5

export interface DashboardInput {
   orders: AdminOrder[]
   appointments: Appointment[]
   products: Product[]
   users: User[]
   today: string // 'YYYY-MM-DD' (se recibe para que esta función siga siendo pura)
}

export interface DashboardSummary {
   revenue: number
   pendingOrders: number
   inProcessOrders: number
   appointmentsToday: number
   upcomingAppointments: number
   customers: number
   lowStockProducts: Product[]
   recentOrders: AdminOrder[]
   nextAppointments: Appointment[]
}

export function summarize({ orders, appointments, products, users, today }: DashboardInput): DashboardSummary {
   const upcoming = appointments
      .filter((a) => isUpcoming(a, today))
      .sort((a, b) => `${a.date} ${a.hour}`.localeCompare(`${b.date} ${b.hour}`))

   const revenue = orders
      .filter((o) => o.status === 'COMPLETED')
      .reduce((sum, o) => sum + o.total, 0)

   return {
      revenue: Math.round(revenue * 100) / 100,
      pendingOrders: orders.filter((o) => o.status === 'PENDING').length,
      inProcessOrders: orders.filter((o) => o.status === 'IN_PROCESS').length,
      appointmentsToday: upcoming.filter((a) => a.date === today).length,
      upcomingAppointments: upcoming.length,
      customers: users.filter((u) => u.role === 'CLIENT').length,
      lowStockProducts: products.filter((p) => p.stock <= LOW_STOCK_THRESHOLD).sort((a, b) => a.stock - b.stock),
      recentOrders: orders.slice(0, 5),
      nextAppointments: upcoming.slice(0, 5),
   }
}