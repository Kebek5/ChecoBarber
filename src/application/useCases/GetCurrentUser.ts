// GetCurrentUser.ts
import type { User } from '@/domain/auth'
import { UnauthenticatedError } from '../errors'
import type { AuthGateway } from '../ports/AuthGateway'

export class GetCurrentUser {
   constructor(private auth: AuthGateway) {}

   async execute(token: string): Promise<User | null> {
      try {
         return await this.auth.me(token)
      } catch (e) {
         if (e instanceof UnauthenticatedError) return null   // token vencido: anónimo
         throw e                                              // backend caído: NO cierra sesión
      }
   }
}