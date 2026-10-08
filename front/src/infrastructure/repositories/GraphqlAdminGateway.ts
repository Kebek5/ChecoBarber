import type {
   AdminAppointmentGateway,
   AdminCatalogGateway,
   AdminOrderGateway,
   AdminUserGateway,
} from '@/application/ports/AdminGateway'
import type { User } from '@/domain/auth/User'
import type { Appointment, AppointmentStatus } from '@/domain/appointment/Appointment'
import type { Product } from '@/domain/catalog/Product'
import type { ProductInput } from '@/domain/catalog/ProductInput'
import type { AdminOrder, OrderStatus } from '@/domain/order/AdminOrder'
import type { GraphqlClient } from '@/infrastructure/graphql/client'
import {
   MUTATION_CREATE_PRODUCT,
   MUTATION_DELETE_PRODUCT,
   MUTATION_UPDATE_APPOINTMENT_STATUS,
   MUTATION_UPDATE_ORDER_STATUS,
   MUTATION_UPDATE_PRODUCT,
   QUERY_ADMIN_APPOINTMENTS,
   QUERY_ADMIN_ORDER_BY_ID,
   QUERY_ADMIN_ORDERS,
   QUERY_ADMIN_USERS,
} from '@/infrastructure/graphql/adminQueries'


interface OrderDTO {
   id: string
   date: string
   total: number
   status: OrderStatus
   client: { id: string; name: string; email: string; tel: string }
   lines: { id: string; amount: number; unitPrice: number; product: { id: string; name: string } }[]
}

interface AppointmentDTO {
   id: string
   date: string
   hour: string
   state: AppointmentStatus
   price: number
   client: { id: string; name: string; tel: string }
   service: { id: string; name: string; duration: string }
}

const toOrder = (dto: OrderDTO): AdminOrder => ({
   id: dto.id,
   date: dto.date,
   total: dto.total,
   status: dto.status,
   customer: dto.client,
   lines: dto.lines.map((l) => ({
      id: l.id,
      productId: l.product.id,
      productName: l.product.name,
      amount: l.amount,
      unitPrice: l.unitPrice,
   })),
})

const toAppointment = (dto: AppointmentDTO): Appointment => ({
   id: dto.id,
   date: dto.date,
   hour: dto.hour,
   status: dto.state,
   price: dto.price,
   customer: dto.client,
   service: dto.service,
})

export class GraphqlAdminGateway implements AdminAppointmentGateway, AdminCatalogGateway, AdminOrderGateway, AdminUserGateway{
   constructor(private readonly gql: GraphqlClient){}

   async createProduct(token: string, input: ProductInput): Promise<Product> {
      const res = await this.gql<{createProduct: Product}>(MUTATION_CREATE_PRODUCT, {data: input}, {token});
      return res.createProduct
   }

   async updateProduct(token: string, id: string, input: ProductInput): Promise<Product | null> {
      const res = await this.gql<{updateProduct: Product | null}>(MUTATION_UPDATE_PRODUCT, {id, data: input}, {token})
      return res.updateProduct
   }

   async deleteProduct(token: string, id: string): Promise<boolean> {
      const res = await this.gql<{deleteProduct: boolean}>(MUTATION_DELETE_PRODUCT, {id}, {token})
      return res.deleteProduct
   }

   async updateOrderStatus(token: string, id: string, status: OrderStatus): Promise<AdminOrder | null> {
      const res = await this.gql<{updateOrderStatus: OrderDTO | null}>(MUTATION_UPDATE_ORDER_STATUS, {id, status}, {token})
      return res.updateOrderStatus ? toOrder(res.updateOrderStatus) : null
   }

   async findOrder(token: string, id: string): Promise<AdminOrder | null> {
      const res = await this.gql<{findOrder: OrderDTO | null}>(QUERY_ADMIN_ORDER_BY_ID, {id}, {token})
      return res.findOrder ? toOrder(res.findOrder) : null
   }

   async listOrders(token: string): Promise<AdminOrder[]> {
      const res = await this.gql<{orders: OrderDTO[]}>(QUERY_ADMIN_ORDERS, {token})
      return res.orders.map(toOrder)
   }

   async listAppointments(token: string): Promise<Appointment[]> {
      const res = await this.gql<{appointments: AppointmentDTO[]}>(QUERY_ADMIN_APPOINTMENTS, {token})
      return res.appointments.map(toAppointment)
   }

   async updateAppointmentStatus(token: string, id: string, status: AppointmentStatus): Promise<Appointment | null> {
      const res = await this.gql<{updateAppointmentStatus: AppointmentDTO | null}>(MUTATION_UPDATE_APPOINTMENT_STATUS, {id, status}, {token})
      return res.updateAppointmentStatus ? toAppointment(res.updateAppointmentStatus) : null
   }

   async listUsers(token: string): Promise<User[]> {
      const res = await this.gql<{users: User[]}>(QUERY_ADMIN_USERS, {token})
      return res.users
   }
}