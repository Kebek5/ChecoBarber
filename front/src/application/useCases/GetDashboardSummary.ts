import type { AdminAppointmentGateway, AdminOrderGateway, AdminUserGateway } from "../ports/AdminGateway";
import type { CatalogRepository } from "../ports/CatalogRepository";
import { summarize, type DashboardSummary } from '@/domain/admin/DashboardSummary'

export class GetDashboardSummary{
   constructor(
      private readonly orders: AdminOrderGateway,
      private readonly appointments: AdminAppointmentGateway,
      private readonly users: AdminUserGateway,
      private readonly catalog: CatalogRepository
   )
   {}

   async execute(token: string, today: string): Promise<DashboardSummary> {
      const [orders, appointments, users, products] = await Promise.all([
         this.orders.listOrders(token),
         this.appointments.listAppointments(token),
         this.users.listUsers(token),
         this.catalog.listProducts(),
      ])
      return summarize({ orders, appointments, products, users, today })
   }
}