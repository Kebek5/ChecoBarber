import type { AdminUserGateway } from '@/application/ports/AdminGateway'
import type { User } from '@/domain/auth/User'

export class ListUsers {
   constructor(private readonly users: AdminUserGateway) {}
   execute(token: string): Promise<User[]> {
      return this.users.listUsers(token)
   }
}