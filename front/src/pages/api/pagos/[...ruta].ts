import type { APIRoute } from 'astro'
import { config } from '@/infrastructure/config'

// Proxy hacia la API REST de pagos del backend.
// El navegador no ve el JWT (cookie httpOnly): aquí se agrega el header Authorization.

const json = (data: unknown, status: number) =>
   new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })

// Solo rutas simples: letras, números, guiones y diagonales (evita "..")
const SAFE_PATH = /^[A-Za-z0-9_-]+(\/[A-Za-z0-9_-]+)*$/

export const ALL: APIRoute = async ({ params, request, locals }) => {
   const ruta = params.ruta ?? ''
   if (!SAFE_PATH.test(ruta)) return json({ error: 'Ruta no válida.' }, 400)
   if (request.method !== 'GET' && request.method !== 'POST') return json({ error: 'Método no permitido.' }, 405)

   const target = new URL(`/pagos/${ruta}`, config.graphqlUrl)
   const headers: Record<string, string> = { 'Content-Type': 'application/json' }
   if (locals.token) headers.Authorization = `Bearer ${locals.token}`

   try {
      const response = await fetch(target, {
         method: request.method,
         headers,
         body: request.method === 'POST' ? await request.text() : undefined,
         signal: AbortSignal.timeout(30_000),
      })
      return new Response(await response.text(), {
         status: response.status,
         headers: { 'Content-Type': response.headers.get('Content-Type') ?? 'application/json' },
      })
   } catch {
      return json({ error: 'El servidor de pagos no está disponible. Intenta de nuevo en un momento.' }, 503)
   }
}