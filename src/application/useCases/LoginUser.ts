import { normalizeEmail, type Credentials, type Session } from '@/domain/auth'
import type { AuthGateway } from '../ports/AuthGateway'

export class LoginUser {
   constructor(private auth: AuthGateway) {}

   execute(credentials: Credentials): Promise<Session> {
      return this.auth.login({
         email: normalizeEmail(credentials.email),
         password: credentials.password,   // sin trim ni validar longitud: cuentas viejas
      })
   }
}

