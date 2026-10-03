import { normalizeEmail, validateRegistration, type Registration, type Session } from '@/domain/auth'
import { InvalidInputError } from '../errors'
import type { AuthGateway } from '../ports/AuthGateway'

export class RegisterCustomer {
   constructor(private auth: AuthGateway) {}

   async execute(registration: Registration): Promise<Session> {
      const errors = validateRegistration(registration)
      if (errors.length > 0) throw new InvalidInputError(errors.join(' '))
      return this.auth.register({ ...registration, email: normalizeEmail(registration.email) })
   }
}

