import type { AstroCookies } from 'astro'

export const SESSION_COOKIE = 'checobarber_session'

// El JWT del backend dura 2 h (auth.js → expiresIn: "2h"); la cookie no debe vivir más que él
export const SESSION_MAX_AGE = 60 * 60 * 2

// La cookie guarda el JWT que firmó el backend.
export function readSessionToken(cookies: AstroCookies): string | null {
  return cookies.get(SESSION_COOKIE)?.value || null
}

export function startSession(cookies: AstroCookies, token: string): void {
  cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    // Con "secure" el navegador descarta la cookie si sirves el sitio en http (salvo localhost)
    secure: import.meta.env.PROD,
    path: '/',
    maxAge: SESSION_MAX_AGE,
  })
}

export function endSession(cookies: AstroCookies): void {
  cookies.delete(SESSION_COOKIE, { path: '/' })
}

// Solo se aceptan rutas internas para no redirigir a otros sitios
export function safeRedirectPath(next: string | null | undefined): string {
  if (next && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\')) {
    return next
  }
  return '/'
}
