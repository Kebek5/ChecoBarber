export type UserId = string
export type Role = 'ADMIN' | 'CLIENT'

export interface User {
   readonly id: UserId
   readonly name: string
   readonly tel: string
   readonly email: string
   readonly role: Role
}

export interface Session {
   readonly token: string
   readonly user: User
}

export interface Credentials {
   readonly email: string
   readonly password: string
}

export interface Registration extends Credentials {
   readonly name: string
   readonly tel: string
}

export const MIN_PASSWORD_LENGTH = 8

export const isAdmin = (user: User | null): boolean => user?.role === 'ADMIN'

export const normalizeEmail = (email: string): string => email.trim().toLowerCase()

/** Devuelve la lista de errores (vacía = válido). El backend vuelve a validar. */
export function validateRegistration(r: Registration): string[] {
   const errors: string[] = []
   if (r.name.trim() === '') errors.push('El nombre es obligatorio.')
   if (r.tel.trim() === '') errors.push('El teléfono es obligatorio.')
   if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(r.email))) errors.push('El correo no es válido.')
   if (r.password.length < MIN_PASSWORD_LENGTH)
      errors.push(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`)
   return errors
}