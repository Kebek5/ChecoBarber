import type { Role, User } from "@/domain/auth/User";
import type { Appointment, AppointmentStatus } from '@/domain/appointment/Appointment'
import type { Product } from "@/domain/catalog/Product";
import type { ProductInput } from "@/domain/catalog/ProductInput"
import type { AdminOrder, OrderStatus } from "@/domain/order/AdminOrder";
import type { AdminStats } from "@/domain/admin/AdminStats";

export interface AdminCatalogGateway {
   createProduct(token: string, product: ProductInput): Promise<Product>
   updateProduct(token: string, id: string, input: ProductInput): Promise<Product | null>
   deleteProduct(token: string, id: string): Promise<boolean>
}

export interface AdminOrderGateway {
   updateOrderStatus(token: string, id: string, status: OrderStatus): Promise<AdminOrder | null>
   findOrder(token: string, id: string): Promise<AdminOrder | null >
   listOrders(token: string): Promise<AdminOrder[]>
}

export interface AdminAppointmentGateway {
   listAppointments(token: string): Promise<Appointment[]>
   updateAppointmentStatus(token: string, id: string, status: AppointmentStatus): Promise<Appointment | null>
}

export interface AdminUserGateway {
   listUsers(token: string): Promise<User[]>
   updateUserRole(token: string, id: string, role: Role): Promise<User | null>
}

export interface AdminStatsGateway {
   getStats(token: string, days: number): Promise<AdminStats>
}
