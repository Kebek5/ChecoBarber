export type Role = 'CLIENT' | 'ADMIN'

export interface User {
  id: string
  name: string
  tel: string
  email: string
  role: Role
}

// Lo que devuelve el backend al iniciar sesión o registrarse
export interface Session {
  token: string
  user: User
}
