import type { AppointmentGateway, BookingInput } from '@/application/ports/AppointmentGateway'
import type { Appointment, AppointmentStatus } from '@/domain/appointment/Appointment'
import type { Service } from '@/domain/appointment/Service'
import type { GraphqlClient } from '@/infrastructure/graphql/client'
import {
   MUTATION_CREATE_APPOINTMENT,
   QUERY_AVAILABLE_HOURS,
   QUERY_MY_APPOINTMENTS,
   QUERY_SERVICES,
} from '@/infrastructure/graphql/appointmentQueries'

interface AppointmentDTO {
   id: string
   date: string
   hour: string
   state: AppointmentStatus
   price: number
   client: { id: string; name: string; tel: string }
   service: { id: string; name: string; duration: string }
}

const toAppointment = (dto: AppointmentDTO): Appointment => ({
   id: dto.id,
   date: dto.date,
   hour: dto.hour,
   status: dto.state,
   price: dto.price,
   customer: dto.client,
   service: dto.service,
})

export class GraphqlAppointmentGateway implements AppointmentGateway {
   constructor(private readonly gql: GraphqlClient) {}

   async listServices(): Promise<Service[]> {
      const res = await this.gql<{ services: Service[] }>(QUERY_SERVICES)
      return res.services
   }

   async availableHours(date: string, serviceId: string): Promise<string[]> {
      const res = await this.gql<{ availableHours: string[] }>(QUERY_AVAILABLE_HOURS, {
         date,
         idService: serviceId,
      })
      return res.availableHours
   }

   async book(token: string, input: BookingInput): Promise<Appointment> {
      const res = await this.gql<{ createAppointment: AppointmentDTO }>(
         MUTATION_CREATE_APPOINTMENT,
         { data: { date: input.date, hour: input.hour, idService: input.serviceId } },
         { token }
      )
      return toAppointment(res.createAppointment)
   }

   async listMine(token: string): Promise<Appointment[]> {
      const res = await this.gql<{ appointments: AppointmentDTO[] }>(QUERY_MY_APPOINTMENTS, {}, { token })
      return res.appointments.map(toAppointment)
   }
}