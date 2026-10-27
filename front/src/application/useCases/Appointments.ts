import { InvalidInputError } from '@/application/errors'
import type { AppointmentGateway, BookingInput } from '@/application/ports/AppointmentGateway'
import type { Appointment } from '@/domain/appointment/Appointment'
import type { Service } from '@/domain/appointment/Service'

const DATE = /^\d{4}-\d{2}-\d{2}$/
const HOUR = /^\d{2}:\d{2}$/

export class ListServices {
   constructor(private readonly gateway: AppointmentGateway) {}
   execute(): Promise<Service[]> {
      return this.gateway.listServices()
   }
}

export class GetAvailableHours {
   constructor(private readonly gateway: AppointmentGateway) {}
   execute(date: string, serviceId: string): Promise<string[]> {
      if (!DATE.test(date)) throw new InvalidInputError('Elige una fecha válida.')
      if (!serviceId) throw new InvalidInputError('Elige un servicio.')
      return this.gateway.availableHours(date, serviceId)
   }
}

export class BookAppointment {
   constructor(private readonly gateway: AppointmentGateway) {}
   execute(token: string, input: BookingInput): Promise<Appointment> {
      if (!input.serviceId) throw new InvalidInputError('Elige un servicio.')
      if (!DATE.test(input.date)) throw new InvalidInputError('Elige una fecha válida.')
      if (!HOUR.test(input.hour)) throw new InvalidInputError('Elige un horario.')
      return this.gateway.book(token, input)
   }
}

export class ListMyAppointments {
   constructor(private readonly gateway: AppointmentGateway) {}
   execute(token: string): Promise<Appointment[]> {
      return this.gateway.listMine(token)
   }
}