export interface StatPoint {
   label: string
   value: number
}

export interface DailySales {
   date: string // 'YYYY-MM-DD'
   shop: number // ventas de la tienda con pago aprobado
   appointments: number // citas completadas
   orders: number
}

export interface MonthlySales {
   month: string // 'YYYY-MM'
   shop: number
   appointments: number
}

export interface HeatCell {
   weekday: number // 1 = lunes ... 7 = domingo
   hour: number
   count: number
}

// Lo que calcula el backend con SQL para las gráficas del panel
export interface AdminStats {
   days: number
   salesByDay: DailySales[]
   salesByMonth: MonthlySales[]
   revenueByCategory: StatPoint[]
   ordersByPaymentMethod: StatPoint[]
   ordersByPaymentStatus: StatPoint[]
   appointmentsByWeekday: StatPoint[]
   appointmentHeatmap: HeatCell[]
   revenueByService: StatPoint[]
   topProductsPaid: StatPoint[]
}
