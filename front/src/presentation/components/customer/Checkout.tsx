import { CheckCircleIcon } from '@phosphor-icons/react'
import { useState, type FormEvent } from 'react'
import { useCartStore } from '@/infrastructure/cart/zustandCartStore'
import { Badge } from '@/presentation/components/ui/badge'
import { Button, buttonVariants } from '@/presentation/components/ui/button'
import { Card } from '@/presentation/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/presentation/components/ui/field'
import { Input } from '@/presentation/components/ui/input'
import { Separator } from '@/presentation/components/ui/separator'
import { Textarea } from '@/presentation/components/ui/textarea'

interface CheckoutProps {
  userName: string
  userEmail: string
  userTel: string
}

export default function Checkout({ userName, userEmail, userTel }: CheckoutProps) {
  const cart = useCartStore((state) => state.items)
  const clearCart = useCartStore((state) => state.clearCart)
  const totalCart = useCartStore((state) => state.getTotalPrice())

  const [isProcessing, setIsProcessing] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handlePayment = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsProcessing(true)
    setError(null)

    // El cliente lo toma el servidor de la sesión, aquí solo van los renglones
    const orderData = {
      lines: cart.map((item) => ({
        productId: String(item.id),
        amount: item.quantity,
      })),
    }

    try {
      const response = await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      })
      const result = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(result.error || 'Ocurrió un error inesperado al procesar tu pedido.')
      }

      setOrderId(String(result.id ?? ''))
      clearCart()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado al procesar tu pedido.')
    } finally {
      setIsProcessing(false)
    }
  }

  if (orderId !== null) {
    return (
      <div className="mx-auto flex min-h-125 w-full max-w-300 flex-col items-center justify-center px-7.5 py-12.5 text-center">
        <div className="mb-5 flex size-17.5 items-center justify-center rounded-full border-2 border-foreground">
          <CheckCircleIcon size={34} weight="bold" />
        </div>
        <Badge variant="outline" className="mb-2.5 uppercase tracking-wider">
          Pedido confirmado
        </Badge>
        <h1 className="mb-2.5 text-4xl font-bold">¡Gracias por tu compra!</h1>
        <p className="mb-6 text-muted-foreground">
          {orderId ? `Tu pedido #${orderId} fue registrado correctamente.` : 'Tu pedido fue registrado correctamente.'}
        </p>
        <a href="/" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
          Volver a la tienda
        </a>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-300 px-7.5 py-12.5">
      <div className="mb-9">
        <Badge variant="outline" className="mb-2.5 uppercase tracking-wider">
          Último paso
        </Badge>
        <h1 className="mb-2 text-[clamp(32px,5vw,52px)] font-bold leading-tight">Checkout</h1>
        <p className="text-muted-foreground">Confirma tus datos para finalizar tu pedido.</p>
      </div>

      <div className="grid items-start gap-7.5 lg:grid-cols-[1fr_350px]">
        <Card className="p-6 shadow-[0_0_15px_#2222]">
          <form onSubmit={handlePayment}>
            <h2 className="mb-6 text-xl font-bold">Datos de entrega</h2>

            {error && (
              <p role="alert" className="mb-5 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                <strong>Error:</strong> {error}
              </p>
            )}

            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="nombre">Nombre completo</FieldLabel>
                <Input id="nombre" required defaultValue={userName} placeholder="Tu nombre" disabled={isProcessing} />
              </Field>
              <Field>
                <FieldLabel htmlFor="correo">Correo electrónico</FieldLabel>
                <Input id="correo" type="email" required defaultValue={userEmail} placeholder="correo@ejemplo.com" disabled={isProcessing} />
              </Field>
              <Field>
                <FieldLabel htmlFor="telefono">Teléfono</FieldLabel>
                <Input id="telefono" type="tel" required defaultValue={userTel} placeholder="3312345678" disabled={isProcessing} />
              </Field>
              <Field>
                <FieldLabel htmlFor="direccion">Dirección de entrega</FieldLabel>
                <Textarea id="direccion" required placeholder="Calle, número, colonia, ciudad" disabled={isProcessing} />
              </Field>
            </FieldGroup>

            <div className="mt-6 flex justify-end gap-2.5">
              <a href="/carrito" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
                Volver al carrito
              </a>
              <Button type="submit" size="lg" disabled={isProcessing || cart.length === 0}>
                {isProcessing ? 'Procesando...' : 'Confirmar pedido'}
              </Button>
            </div>
          </form>
        </Card>

        <Card className="sticky top-28 gap-0 bg-muted/40 p-6 shadow-[0_0_15px_#2222]">
          <h2 className="mb-6 text-xl font-bold">Resumen</h2>
          <ul className="flex flex-col gap-3">
            {cart.map((item) => (
              <li key={item.id} className="flex justify-between gap-2.5 border-b pb-2.5">
                <div>
                  <p className="text-sm font-medium">{item.name}</p>
                  <small className="text-muted-foreground">
                    {item.quantity} × ${item.price.toFixed(2)}
                  </small>
                </div>
                <strong className="whitespace-nowrap">${(item.price * item.quantity).toFixed(2)}</strong>
              </li>
            ))}
          </ul>
          <Separator className="mt-5" />
          <div className="flex justify-between pt-4">
            <span>Total</span>
            <strong className="text-xl">${totalCart.toFixed(2)}</strong>
          </div>
        </Card>
      </div>
    </div>
  )
}