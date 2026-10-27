import { defineMiddleware } from 'astro:middleware'
import { BackendUnavailableError } from '@/application/errors'
import { endSession, readSessionToken } from '@/infrastructure/auth/session'
import { getCurrentUser } from '@/infrastructure/container'
import type { User } from '@/domain/auth/User'

// Páginas que requieren haber iniciado sesión
const PROTECTED = ['/checkout', '/pago', '/mis-compras']

const ADMIN_ONLY = ['/dashboard']

const matches = (pathname: string, base: string) => pathname === base || pathname.startsWith(`${base}/`)

export const onRequest = defineMiddleware(async (context, next) => {
  const token = readSessionToken(context.cookies)
  let user: User | null = null
  let backendDown = false

  if (token) {
    try {
      user = await getCurrentUser.execute(token)
      // null = token vencido o inválido: se limpia la cookie
      if (!user) endSession(context.cookies)
    } catch (err) {
      // Backend caído: seguimos como anónimo pero NO borramos la cookie (el usuario no hizo nada mal)
      if (!(err instanceof BackendUnavailableError)) throw err
      backendDown = true
    }
  }

  context.locals.user = user
  context.locals.token = user ? token : null
  context.locals.backendDown = backendDown

  const { pathname, search } = context.url
  const needsAdmin = ADMIN_ONLY.some((path) => pathname === path || pathname.startsWith(`${path}/`))
  const isProtected = PROTECTED.some((path) => pathname === path || pathname.startsWith(`${path}/`))

  if (isProtected && !user) {
    if (backendDown) {
      return new Response('El servidor no está disponible. Intenta de nuevo en un momento.', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Retry-After': '30' },
      })
    }
    return context.redirect(`/login?next=${encodeURIComponent(pathname + search)}`)
  }

    if (needsAdmin && user?.role !== 'ADMIN') {
      if (backendDown || user) return context.redirect('/')
      return context.redirect(`/login?next=${encodeURIComponent(pathname + search)}`)
  }

  return next()
})
