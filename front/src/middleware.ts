import { defineMiddleware } from 'astro:middleware'
import { BackendUnavailableError } from '@/application/errors'
import { endSession, readSessionToken } from '@/infrastructure/auth/session'
import { getCurrentUser } from '@/infrastructure/container'
import type { User } from '@/domain/auth/User'
import { stripLocale } from '@/i18n/ui'

// Páginas que requieren haber iniciado sesión
const PROTECTED = ['/checkout', '/pago', '/mis-compras', '/datos-fiscales']

const ADMIN_ONLY = ['/dashboard']

const matches = (pathname: string, base: string) => pathname === base || pathname.startsWith(`${base}/`)

export const onRequest = defineMiddleware(async (context, next) => {
  let user: User | null = null
  let backendDown = false

  // Segunda pasada: el fallback de i18n reescribió /en/... a /... y la sesión ya se resolvió.
  // Se compara contra undefined (en lugar de usar `in`) para que TypeScript no reduzca `locals` a `never`.
  const alreadyResolved = (context.locals as Partial<App.Locals>).user !== undefined

  if (alreadyResolved) {
    user = context.locals.user
    backendDown = context.locals.backendDown
  } else {
    const token = readSessionToken(context.cookies)

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
  }

  // Las reglas se evalúan sin el prefijo de idioma: /en/checkout se protege igual que /checkout
  const { pathname: rawPath, search } = context.url
  const pathname = stripLocale(rawPath)
  const loginPath = rawPath !== pathname ? '/en/login' : '/login'

  const needsAdmin = ADMIN_ONLY.some((path) => matches(pathname, path))
  const isProtected = PROTECTED.some((path) => matches(pathname, path))

  if (isProtected && !user) {
    if (backendDown) {
      return new Response('El servidor no está disponible. Intenta de nuevo en un momento.', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Retry-After': '30' },
      })
    }
    return context.redirect(`${loginPath}?next=${encodeURIComponent(rawPath + search)}`)
  }

  if (needsAdmin && user?.role !== 'ADMIN') {
    if (backendDown || user) return context.redirect('/')
    return context.redirect(`${loginPath}?next=${encodeURIComponent(rawPath + search)}`)
  }

  return next()
})