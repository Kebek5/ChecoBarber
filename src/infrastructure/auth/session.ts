import { createHmac, timingSafeEqual } from 'node:crypto'
import type { AstroCookies } from 'astro'
import type { User } from '@/domain/auth/User'
import { config } from '@/infrastructure/config'

export const SESSION_COOKIE = 'checobarber_session'
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 días en segundos

const sign = (data: string): string => {
  if (!config.authSecret) throw new Error('Falta AUTH_SECRET en el archivo .env')
  return createHmac('sha256', config.authSecret).update(data).digest('base64url')
}

export function createSessionToken(user: User): string {
  const payload = Buffer.from(
    JSON.stringify({ user, exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE })
  ).toString('base64url')
  return `${payload}.${sign(payload)}`
}

export function readSessionToken(token: string | undefined): User | null {
  if (!token) return null

  const [payload, signature] = token.split('.')
  if (!payload || !signature) return null

  const expected = Buffer.from(sign(payload))
  const received = Buffer.from(signature)
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'))
    if (data.exp < Math.floor(Date.now() / 1000)) return null
    return data.user as User
  } catch {
    return null
  }
}

export function startSession(cookies: AstroCookies, user: User): void {
  cookies.set(SESSION_COOKIE, createSessionToken(user), {
    httpOnly: true,
    sameSite: 'lax',
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