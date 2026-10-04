export type Role = 'CLIENT' | 'ADMIN'

export interface User {
  id: string
  name: string
  tel: string
  email: string
  role: Role
}