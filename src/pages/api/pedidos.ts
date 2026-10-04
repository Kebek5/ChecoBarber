import type { APIRoute } from 'astro'
import { placeOrder } from '@/infrastructure/container'

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user
  if (!user) return json({ error: 'Debes iniciar sesión para finalizar la compra.' }, 401)

  try {
    const body = await request.json()
    const lines = Array.isArray(body?.lines) ? body.lines : []

    const confirmation = await placeOrder.execute({
      customer: { id: user.id },
      lines: lines.map((line: { productId: unknown; amount: unknown }) => ({
        productId: String(line.productId),
        amount: Number(line.amount),
      })),
    })

    return json(confirmation)
  } catch (err) {
    return json(
      { error: err instanceof Error ? err.message : 'Ocurrió un error inesperado al procesar tu pedido.' },
      400
    )
  }
}