import type { User } from '@/domain/auth/User'

export interface StoredUser extends User {
  passwordHash: string
}

export interface NewUserRecord {
  name: string
  tel: string
  email: string
  passwordHash: string
}

export interface UserRepository {
  findByEmail(email: string): Promise<StoredUser | null>
  create(user: NewUserRecord): Promise<User>
  updatePasswordHash(id: string, passwordHash: string): Promise<void>
}