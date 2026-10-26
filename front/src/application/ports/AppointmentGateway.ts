import type { Appointment } from '@/domain/appointment/Appointment'
import type { Service } from '@/domain/appointment/Service'

export interface BookingInput {
   date: string
   hour: string
   serviceId: string
}

export interface AppointmentGateway {
   listServices(): Promise<Service[]>
   availableHours(date: string, serviceId: string): Promise<string[]>
   book(token: string, input: BookingInput): Promise<Appointment>
   listMine(token: string): Promise<Appointment[]>
}