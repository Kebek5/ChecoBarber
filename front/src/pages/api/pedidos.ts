import type { APIRoute } from 'astro'
import { BackendUnavailableError, UnauthenticatedError } from '@/application/errors'
import { placeOrder } from '@/infrastructure/container'
import type { DeliveryType, PaymentMethod } from '@/domain/order/Payment'

const PAYMENT_METHODS: PaymentMethod[] = ['MERCADOPAGO', 'LINK', 'PAYPAL', 'TERMINAL', 'CASH']
const DELIVERY_TYPES: DeliveryType[] = ['SHIPPING', 'PICKUP']

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

  let body: { lines?: unknown; paymentMethod?: unknown; deliveryType?: unknown; address?: unknown }
  try {
    body = await request.json()
  } catch {
    return json({ error: 'La solicitud no es válida.' }, 400)
  }

  try {
    const lines = Array.isArray(body?.lines) ? body.lines : []
    const paymentMethod = PAYMENT_METHODS.find((m) => m === body?.paymentMethod)
    const deliveryType = DELIVERY_TYPES.find((d) => d === body?.deliveryType)
    if (!paymentMethod || !deliveryType) {
      return json({ error: 'Selecciona un método de pago y un tipo de entrega.' }, 400)
    }

    // Los precios no viajan: el backend los toma de la base de datos
    const confirmation = await placeOrder.execute(token, {
      customer: { id: user.id },
      lines: lines.map((line: { productId: unknown; amount: unknown }) => ({
        productId: String(line.productId),
        amount: Number(line.amount),
      })),
      paymentMethod,
      deliveryType,
      address: typeof body.address === 'string' ? body.address : undefined,
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