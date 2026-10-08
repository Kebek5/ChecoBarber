import { InvalidInputError } from '@/application/errors'
import type { AuthGateway } from '@/application/ports/AuthGateway'
import type { Session } from '@/domain/auth/User'

export interface RegisterInput {
  name: string
  tel: string
  email: string
  password: string
}

export class RegisterUser {
  constructor(private readonly auth: AuthGateway) {}

  // Validamos aquí para dar errores rápidos; el backend vuelve a validar
  async execute(input: RegisterInput): Promise<Session> {
    const name = input.name.trim()
    const tel = input.tel.trim()
    const email = input.email.trim().toLowerCase()

    if (name.length < 3) throw new InvalidInputError('Escribe tu nombre completo.')
    if (!/^\d{10}$/.test(tel)) throw new InvalidInputError('El teléfono debe tener 10 dígitos.')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 128) {
      throw new InvalidInputError('El correo electrónico no es válido.')
    }
    if (input.password.length < 8) {
      throw new InvalidInputError('La contraseña debe tener al menos 8 caracteres.')
    }

    return this.auth.register({ name, tel, email, password: input.password })
  }
}
