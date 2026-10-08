import type { AuthGateway } from '@/application/ports/AuthGateway'
import type { Session } from '@/domain/auth/User'

export interface LoginInput {
  email: string
  password: string
}

export class LoginUser {
  constructor(private readonly auth: AuthGateway) {}

  execute(input: LoginInput): Promise<Session> {
    return this.auth.login({
      email: input.email.trim().toLowerCase(),
      // Sin trim ni validar largo: puede haber cuentas viejas con contraseñas cortas
      password: input.password,
    })
  }
}
