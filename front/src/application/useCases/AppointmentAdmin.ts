import { InvalidInputError } from '@/application/errors'
import type { AdminAppointmentGateway } from '@/application/ports/AdminGateway'
import type { Appointment, AppointmentStatus } from '@/domain/appointment/Appointment'

export class ListAdminAppointments {
   constructor(private readonly appointments: AdminAppointmentGateway) {}
   execute(token: string): Promise<Appointment[]> {
      return this.appointments.listAppointments(token)
   }
}

export class UpdateAppointmentStatus {
   constructor(private readonly appointments: AdminAppointmentGateway) {}

   async execute(token: string, id: string, status: AppointmentStatus): Promise<Appointment> {
      // Una cita solo puede cerrarse; no se regresa a "pendiente" (el backend también lo valida)
      if (status === 'PENDING') throw new InvalidInputError('Una cita no puede volver a pendiente.')
      const updated = await this.appointments.updateAppointmentStatus(token, id, status)
      if (!updated) throw new InvalidInputError('La cita no existe.')
      return updated
   }
}