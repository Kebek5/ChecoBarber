import { defineMiddleware } from 'astro:middleware'
import { SESSION_COOKIE, readSessionToken } from '@/infrastructure/auth/session'

// Páginas que requieren haber iniciado sesión
const PROTECTED = ['/checkout']

export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.user = readSessionToken(context.cookies.get(SESSION_COOKIE)?.value)

  const { pathname } = context.url
  const isProtected = PROTECTED.some((path) => pathname === path || pathname.startsWith(`${path}/`))

  if (isProtected && !context.locals.user) {
    return context.redirect(`/login?next=${encodeURIComponent(pathname)}`)
  }

  return next()
})