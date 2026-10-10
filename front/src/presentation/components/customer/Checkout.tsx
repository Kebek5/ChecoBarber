import { useState, type FormEvent } from 'react'
import { PAYMENT_METHODS, type DeliveryType, type PaymentMethod } from '@/domain/order/Payment'
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

const DELIVERY_OPTIONS: { id: DeliveryType; label: string; description: string }[] = [
  { id: 'SHIPPING', label: 'Envío a domicilio', description: 'Te lo llevamos a la dirección que indiques.' },
  { id: 'PICKUP', label: 'Recoger en la barbería', description: 'Pasas por tu pedido; puedes pagar al recoger.' },
]

const optionClass = (selected: boolean, disabled = false) =>
  `flex cursor-pointer items-start gap-3 rounded-lg border p-3.5 text-left transition-colors ${
    selected ? 'border-foreground bg-muted/60' : 'hover:bg-muted/40'
  } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`

export default function Checkout({ userName, userEmail, userTel }: CheckoutProps) {
  const cart = useCartStore((state) => state.items)
  const clearCart = useCartStore((state) => state.clearCart)
  const totalCart = useCartStore((state) => state.getTotalPrice())

  const [deliveryType, setDeliveryType] = useState<DeliveryType>('SHIPPING')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('MERCADOPAGO')
  const [address, setAddress] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const changeDelivery = (type: DeliveryType) => {
    setDeliveryType(type)
    // Terminal y efectivo solo existen al recoger
    if (type === 'SHIPPING' && (paymentMethod === 'TERMINAL' || paymentMethod === 'CASH')) {
      setPaymentMethod('MERCADOPAGO')
    }
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsProcessing(true)
    setError(null)

    // El cliente lo toma el servidor de la sesión; los precios los toma el backend de la BD
    const orderData = {
      lines: cart.map((item) => ({ productId: String(item.id), amount: item.quantity })),
      paymentMethod,
      deliveryType,
      address: deliveryType === 'SHIPPING' ? address : undefined,
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

      clearCart()
      // El pago se completa en la página de seguimiento del pedido
      window.location.href = `/pedido/${encodeURIComponent(result.reference)}`
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado al procesar tu pedido.')
      setIsProcessing(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-300 px-7.5 py-12.5">
      <div className="mb-9">
        <Badge variant="outline" className="mb-2.5 uppercase tracking-wider">
          Último paso
        </Badge>
        <h1 className="mb-2 text-[clamp(32px,5vw,52px)] font-bold leading-tight">Checkout</h1>
        <p className="text-muted-foreground">Confirma tus datos y elige cómo quieres pagar.</p>
      </div>

      <div className="grid items-start gap-7.5 lg:grid-cols-[1fr_350px]">
        <Card className="p-6 shadow-[0_0_15px_#2222]">
          <form onSubmit={handleSubmit}>
            {error && (
              <p role="alert" className="mb-5 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                <strong>Error:</strong> {error}
              </p>
            )}

            <h2 className="mb-6 text-xl font-bold">Tus datos</h2>
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
            </FieldGroup>

            <Separator className="my-7" />

            <h2 className="mb-4 text-xl font-bold">Entrega</h2>
            <div role="radiogroup" aria-label="Tipo de entrega" className="grid gap-3 sm:grid-cols-2">
              {DELIVERY_OPTIONS.map((option) => (
                <label key={option.id} className={optionClass(deliveryType === option.id)}>
                  <input
                    type="radio"
                    name="entrega"
                    value={option.id}
                    checked={deliveryType === option.id}
                    onChange={() => changeDelivery(option.id)}
                    disabled={isProcessing}
                    className="mt-1 accent-foreground"
                  />
                  <span>
                    <span className="block text-sm font-bold">{option.label}</span>
                    <span className="block text-xs text-muted-foreground">{option.description}</span>
                  </span>
                </label>
              ))}
            </div>

            {deliveryType === 'SHIPPING' && (
              <Field className="mt-5">
                <FieldLabel htmlFor="direccion">Dirección de entrega</FieldLabel>
                <Textarea
                  id="direccion"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Calle, número, colonia, ciudad"
                  disabled={isProcessing}
                />
              </Field>
            )}

            <Separator className="my-7" />

            <h2 className="mb-4 text-xl font-bold">Método de pago</h2>
            <div role="radiogroup" aria-label="Método de pago" className="flex flex-col gap-3">
              {PAYMENT_METHODS.map((method) => {
                const unavailable = method.pickupOnly && deliveryType !== 'PICKUP'
                return (
                  <label key={method.id} className={optionClass(paymentMethod === method.id, unavailable)}>
                    <input
                      type="radio"
                      name="metodo"
                      value={method.id}
                      checked={paymentMethod === method.id}
                      onChange={() => setPaymentMethod(method.id)}
                      disabled={isProcessing || unavailable}
                      className="mt-1 accent-foreground"
                    />
                    <span>
                      <span className="block text-sm font-bold">{method.label}</span>
                      <span className="block text-xs text-muted-foreground">
                        {unavailable ? 'Disponible solo si recoges en la barbería.' : method.description}
                      </span>
                    </span>
                  </label>
                )
              })}
            </div>

            <div className="mt-7 flex justify-end gap-2.5">
              <a href="/carrito" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
                Volver al carrito
              </a>
              <Button type="submit" size="lg" disabled={isProcessing || cart.length === 0}>
                {isProcessing ? 'Procesando...' : 'Continuar al pago'}
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