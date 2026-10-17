import type { APIRoute } from 'astro'
import { paymentGateway } from '@/infrastructure/container'

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.token) return json({ error: 'Debes iniciar sesión.' }, 401)
  const { orderId, method } = await request.json().catch(() => ({}))
  if (method !== 'MERCADOPAGO' && method !== 'PAYPAL') return json({ error: 'Método de pago no válido.' }, 400)
  try {
    return json({ url: await paymentGateway.start(locals.token, String(orderId), method) })
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'No se pudo iniciar el pago.' }, 400)
  }
}