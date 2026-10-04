import type { PasswordHasher } from '@/application/ports/PasswordHasher'
import type { UserRepository } from '@/application/ports/UserRepository'
import type { User } from '@/domain/auth/User'

export interface RegisterInput {
  name: string
  tel: string
  email: string
  password: string
}

export class RegisterUser {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher
  ) {}

  async execute(input: RegisterInput): Promise<User> {
    const name = input.name.trim()
    const tel = input.tel.trim()
    const email = input.email.trim().toLowerCase()

    if (name.length < 3) throw new Error('Escribe tu nombre completo.')
    if (!/^\d{10}$/.test(tel)) throw new Error('El teléfono debe tener 10 dígitos.')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 128) {
      throw new Error('El correo electrónico no es válido.')
    }
    if (input.password.length < 8) {
      throw new Error('La contraseña debe tener al menos 8 caracteres.')
    }
    if (await this.users.findByEmail(email)) {
      throw new Error('Ya existe una cuenta con ese correo.')
    }

    const passwordHash = await this.hasher.hash(input.password)
    return this.users.create({ name, tel, email, passwordHash })
  }
}