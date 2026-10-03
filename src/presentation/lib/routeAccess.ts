import { isAdmin, type User } from '@/domain/auth'

const AUTH_REQUIRED = ['/checkout', '/cuenta']
const ADMIN_ONLY = ['/admin']
const GUEST_ONLY = ['/login', '/registro']

// "/cuenta" y "/cuenta/pedidos" coinciden; "/cuenta-falsa" no.
const matches = (path: string, base: string) => path === base || path.startsWith(`${base}/`)

export type Access = 'allow' | 'login' | 'forbidden' | 'home'

export function accessFor(pathname: string, user: User | null): Access {
   if (ADMIN_ONLY.some((b) => matches(pathname, b)))
      return !user ? 'login' : isAdmin(user) ? 'allow' : 'forbidden'

   if (AUTH_REQUIRED.some((b) => matches(pathname, b)))
      return user ? 'allow' : 'login'

   if (GUEST_ONLY.some((b) => matches(pathname, b)))
      return user ? 'home' : 'allow'      // si ya inició sesión, no tiene sentido ver /login

   return 'allow'
}