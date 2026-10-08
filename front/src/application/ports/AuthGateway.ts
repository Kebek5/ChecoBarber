import type { Session, User } from '@/domain/auth/User'

export interface LoginData {
  email: string
  password: string
}

export interface RegisterData extends LoginData {
  name: string
  tel: string
}

// El backend es quien cifra y compara contraseñas y firma el token (JWT)
export interface AuthGateway {
  login(data: LoginData): Promise<Session>
  register(data: RegisterData): Promise<Session>
  /** Devuelve el usuario dueño del token; lanza UnauthenticatedError si venció o es inválido. */
  me(token: string): Promise<User>
}
