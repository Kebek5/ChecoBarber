import { defineMiddleware } from 'astro:middleware'
import { container } from '@/infrastructure/container'
import { BackendUnavailableError } from '@/application/errors'
import { accessFor } from '@/presentation/lib/routeAccess'
import type { User } from '@/domain/auth'

const COOKIE = 'session'

export const onRequest = defineMiddleware(async (context, next) => {
   const token = context.cookies.get(COOKIE)?.value ?? null
   let user: User | null = null
   let backendDown = false

   if (token) {
      try {
         user = await container.getCurrentUser.execute(token)
         // null = token vencido o inválido: se limpia la cookie
         if (!user) context.cookies.delete(COOKIE, { path: '/' })
      } catch (error) {
         if (!(error instanceof BackendUnavailableError)) throw error
         backendDown = true          // backend caído: NO se borra la cookie
      }
   }

   context.locals.user = user
   context.locals.token = user ? token : null
   context.locals.backendDown = backendDown

   switch (accessFor(context.url.pathname, user)) {
      case 'login': {
         if (backendDown) return context.rewrite('/503')   // no es culpa del usuario
         const returnTo = context.url.pathname + context.url.search
         return context.redirect(`/login?next=${encodeURIComponent(returnTo)}`)
      }
      case 'forbidden':
         return context.redirect('/')
      case 'home':
         return context.redirect('/')
      default:
         return next()
   }
})