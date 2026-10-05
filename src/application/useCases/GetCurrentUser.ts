import { UnauthenticatedError } from '@/application/errors'
import type { AuthGateway } from '@/application/ports/AuthGateway'
import type { User } from '@/domain/auth/User'

export class GetCurrentUser {
  constructor(private readonly auth: AuthGateway) {}

  /** null = token vencido o inválido. Si el backend está caído lanza BackendUnavailableError. */
  async execute(token: string): Promise<User | null> {
    try {
      return await this.auth.me(token)
    } catch (err) {
      if (err instanceof UnauthenticatedError) return null
      throw err
    }
  }
}
