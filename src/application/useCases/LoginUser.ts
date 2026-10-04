import type { PasswordHasher } from '@/application/ports/PasswordHasher'
import type { UserRepository } from '@/application/ports/UserRepository'
import type { User } from '@/domain/auth/User'

export interface LoginInput {
  email: string
  password: string
}

export class LoginUser {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher
  ) {}

  async execute(input: LoginInput): Promise<User> {
    const email = input.email.trim().toLowerCase()
    const stored = await this.users.findByEmail(email)
    const valid = stored ? await this.hasher.verify(input.password, stored.passwordHash) : false

    if (!stored || !valid) {
      throw new Error('Correo o contraseña incorrectos.')
    }

    // Si la contraseña seguía en texto plano (db.sql), la guardamos ya cifrada
    if (this.hasher.needsRehash(stored.passwordHash)) {
      await this.users.updatePasswordHash(stored.id, await this.hasher.hash(input.password))
    }

    const { passwordHash: _passwordHash, ...user } = stored
    return user
  }
}