import type { User } from '@/domain/auth/User'
import type { Product } from '@/domain/catalog/Product'
import { isUpcoming, type Appointment } from '@/domain/appointment/Appointment'
import type { AdminOrder } from '@/domain/order/AdminOrder'

export const LOW_STOCK_THRESHOLD = 5
export const SALES_CHART_DAYS = 14

export interface ChartPoint {
   label: string
   value: number
   hint?: string
}

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
   salesByDay: ChartPoint[]
   ordersByStatus: ChartPoint[]
   topProducts: ChartPoint[]
   appointmentsByService: ChartPoint[]
}

const round2 = (n: number) => Math.round(n * 100) / 100

// Últimos n días terminando en `today`, como 'YYYY-MM-DD'
function lastDays(today: string, n: number): string[] {
   const [y, m, d] = today.split('-').map(Number)
   return Array.from({ length: n }, (_, i) =>
      new Date(Date.UTC(y, m - 1, d - (n - 1 - i))).toISOString().slice(0, 10)
   )
}

const shortDate = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`

// Cuenta/suma por clave y devuelve los `limit` mayores
function topBy(entries: [string, number][], limit: number): ChartPoint[] {
   const totals = new Map<string, number>()
   for (const [key, value] of entries) totals.set(key, (totals.get(key) ?? 0) + value)
   return [...totals.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([label, value]) => ({ label, value }))
}

export function summarize({ orders, appointments, products, users, today }: DashboardInput): DashboardSummary {
   const upcoming = appointments
      .filter((a) => isUpcoming(a, today))
      .sort((a, b) => `${a.date} ${a.hour}`.localeCompare(`${b.date} ${b.hour}`))

   const completed = orders.filter((o) => o.status === 'COMPLETED')
   const revenue = completed.reduce((sum, o) => sum + o.total, 0)

   // Ventas por día (solo completados), con los días sin ventas en cero
   const days = lastDays(today, SALES_CHART_DAYS)
   const dayTotals = new Map(days.map((d) => [d, 0]))
   for (const o of completed) {
      const key = o.date.slice(0, 10)
      if (dayTotals.has(key)) dayTotals.set(key, dayTotals.get(key)! + o.total)
   }

   return {
      revenue: round2(revenue),
      pendingOrders: orders.filter((o) => o.status === 'PENDING').length,
      inProcessOrders: orders.filter((o) => o.status === 'IN_PROCESS').length,
      appointmentsToday: upcoming.filter((a) => a.date === today).length,
      upcomingAppointments: upcoming.length,
      customers: users.filter((u) => u.role === 'CLIENT').length,
      lowStockProducts: products.filter((p) => p.stock <= LOW_STOCK_THRESHOLD).sort((a, b) => a.stock - b.stock),
      recentOrders: orders.slice(0, 5),
      nextAppointments: upcoming.slice(0, 5),

      salesByDay: days.map((d) => ({ label: shortDate(d), value: round2(dayTotals.get(d)!), hint: d })),
      ordersByStatus: [
         { label: 'Pendientes', value: orders.filter((o) => o.status === 'PENDING').length },
         { label: 'En proceso', value: orders.filter((o) => o.status === 'IN_PROCESS').length },
         { label: 'Completados', value: completed.length },
      ],
      topProducts: topBy(
         completed.flatMap((o) => o.lines.map((l): [string, number] => [l.productName, l.amount])),
         5
      ),
      appointmentsByService: topBy(
         appointments.filter((a) => a.status !== 'CANCELLED').map((a): [string, number] => [a.service.name, 1]),
         5
      ),
   }
}