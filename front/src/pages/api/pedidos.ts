import type { APIRoute } from 'astro'
import { BackendUnavailableError, UnauthenticatedError } from '@/application/errors'
import { placeOrder } from '@/infrastructure/container'

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

export const POST: APIRoute = async ({ request, locals }) => {
  const { user, token } = locals

  if (!user || !token) {
    return locals.backendDown
      ? json({ error: 'El servidor no está disponible. Intenta de nuevo en un momento.' }, 503)
      : json({ error: 'Debes iniciar sesión para finalizar la compra.' }, 401)
  }

  let body: { lines?: unknown }
  try {
    body = await request.json()
  } catch {
    return json({ error: 'La solicitud no es válida.' }, 400)
  }

  try {
    const lines = Array.isArray(body?.lines) ? body.lines : []

    // Los precios no viajan: el backend los toma de la base de datos
    const confirmation = await placeOrder.execute(token, {
      customer: { id: user.id },
      lines: lines.map((line: { productId: unknown; amount: unknown }) => ({
        productId: String(line.productId),
        amount: Number(line.amount),
      })),
    })

    return json(confirmation)
  } catch (err) {
    // El token pudo vencer entre el middleware y la mutación
    if (err instanceof UnauthenticatedError) {
      return json({ error: 'Tu sesión expiró. Inicia sesión de nuevo.' }, 401)
    }
    if (err instanceof BackendUnavailableError) return json({ error: err.message }, 503)

    return json(
      { error: err instanceof Error ? err.message : 'Ocurrió un error inesperado al procesar tu pedido.' },
      400
    )
  }
}
