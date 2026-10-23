export type AppointmentStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED'

export interface Appointment {
   id: string
   date: string // 'YYYY-MM-DD'
   hour: string // 'HH:MM'
   status: AppointmentStatus
   price: number
   customer: { id: string; name: string; tel: string }
   service: { id: string; name: string; duration: string }
}

export const APPOINTMENT_STATUSES: readonly AppointmentStatus[] = ['PENDING', 'COMPLETED', 'CANCELLED']

export const isAppointmentStatus = (value: string): value is AppointmentStatus =>
   (APPOINTMENT_STATUSES as readonly string[]).includes(value)

// Solo una cita pendiente puede cerrarse (completada o cancelada); después ya no cambia
export const nextAppointmentStatuses = (status: AppointmentStatus): AppointmentStatus[] =>
   status === 'PENDING' ? ['COMPLETED', 'CANCELLED'] : []

// Las fechas ISO ('YYYY-MM-DD') se comparan bien como texto
export const isUpcoming = (appointment: Appointment, today: string): boolean =>
   appointment.status === 'PENDING' && appointment.date >= today