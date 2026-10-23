import { InvalidInputError } from '@/application/errors'
import type { AdminUserGateway } from '@/application/ports/AdminGateway'
import type { Role, User } from '@/domain/auth/User'

export class UpdateUserRole {
   constructor(private readonly users: AdminUserGateway) {}

   async execute(token: string, actorId: string, id: string, role: string): Promise<User> {
      if (role !== 'ADMIN' && role !== 'CLIENT') throw new InvalidInputError('El rol no es válido.')
      // Evita que el único admin se quite el acceso por accidente
      if (id === actorId) throw new InvalidInputError('No puedes cambiar tu propio rol.')
      const updated = await this.users.updateUserRole(token, id, role as Role)
      if (!updated) throw new InvalidInputError('El usuario no existe.')
      return updated
   }
}