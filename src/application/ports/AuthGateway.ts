import type { Credentials, Registration, Session, User } from '@/domain/auth/index'

export interface AuthGateway {
   login(credentials: Credentials): Promise<Session>
   register(registration: Registration): Promise<Session>
   me(token: string): Promise<User | null> /** null si el token es inválido o venció. */
}