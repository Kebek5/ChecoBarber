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
import { localizeHref } from '@/i18n/routes'
import { t, type Lang } from '@/i18n/ui'
import { translateError } from '@/i18n/errors'

interface CheckoutProps {
  userName: string
  userEmail: string
  userTel: string
  lang?: Lang
}

const DELIVERY_OPTIONS: { id: DeliveryType, label: string, description: string }[] = [
  {
    id: 'SHIPPING',
    label: 'checkoutShipping',
    description: 'checkoutShippingDescription',
  },
  {
    id: 'PICKUP',
    label: 'checkoutPickup',
    description: 'checkoutPickupDescription',
  },
]

const optionClass = (selected: boolean, disabled = false) =>
  `flex cursor-pointer items-start gap-3 rounded-lg border p-3.5 text-left transition-colors ${
    selected ? 'border-foreground bg-muted/60' : 'hover:bg-muted/40'
  } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`

export default function Checkout({ userName, userEmail, userTel, lang = 'es' }: CheckoutProps) {
  const cart = useCartStore((state) => state.items)
  const clearCart = useCartStore((state) => state.clearCart)
  const totalCart = useCartStore((state) => state.getTotalPrice())

  const [deliveryType, setDeliveryType] = useState<DeliveryType>('SHIPPING')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('MERCADOPAGO')
  const [address, setAddress] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const availableMethods = PAYMENT_METHODS.filter((m) => !m.pickupOnly || deliveryType === 'PICKUP')

  const changeDelivery = (type: DeliveryType) => {
    setDeliveryType(type)
    if (type === 'SHIPPING' && (paymentMethod === 'TERMINAL' || paymentMethod === 'CASH')) {
      setPaymentMethod('MERCADOPAGO')
    }
  }

  const paymentLabel = (id: PaymentMethod) => {
      const labels: Record<PaymentMethod, string> = {
        MERCADOPAGO: 'Mercado Pago',
        LINK: 'Link',
        PAYPAL: 'PayPal',
        TERMINAL: 'Terminal',
        CASH: 'Efectivo',
      }

      return labels[id] ?? id
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (cart.length === 0) {
      setError(t(lang, 'checkoutEmptyCart'))
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      // 1. Crear el pedido (el backend toma los precios de la base de datos)
      const response = await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lines: cart.map((item) => ({ productId: String(item.id), amount: item.quantity })),
          paymentMethod,
          deliveryType,
          address: deliveryType === 'SHIPPING' ? address : undefined,
        }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(
          result.error
            ? translateError(lang, result.error)
            : t(lang, 'checkoutUnexpectedError')
        )
      }

      if (!result.reference) {
        throw new Error(t(lang, 'checkoutMissingReference'))
      }

      // El stock ya quedó apartado: se vacía el carrito
      clearCart()
      const trackingUrl = `/pedido/${result.reference}`

      // 2. El pago se hace en la página del pedido: Mercado Pago (Checkout API), PayPal, terminal o efectivo
      window.location.href = trackingUrl
    } catch (err) {
      setError(
        err instanceof Error
          ? translateError(lang, err.message)
          : t(lang, 'checkoutUnexpectedError')
      )
    }

  }

  return (
    <div className="mx-auto w-full max-w-300 px-7.5 py-12.5">
      <div className="mb-9">
        <Badge variant="outline" className="mb-2.5 uppercase tracking-wider">{t(lang,'checkoutLastStep')}</Badge>
        <h1 className="mb-2 text-[clamp(32px,5vw,52px)] font-bold leading-tight">Checkout</h1>
        <p className="text-muted-foreground">{t(lang,'checkoutIntro')}</p>
      </div>

      <div className="grid items-start gap-7.5 lg:grid-cols-[1fr_350px]">
        <Card className="p-6 shadow-[0_0_15px_#2222]">
          <form onSubmit={handleSubmit}>
            {error && (
              <p role="alert" className="mb-5 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                <strong>Error:</strong> {error}
              </p>
            )}

            <h2 className="mb-6 text-xl font-bold">{t(lang,'checkoutYourData')}</h2>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="nombre">{t(lang,'checkoutFullName')}</FieldLabel>
                <Input id="nombre" required defaultValue={userName} placeholder={t(lang,'checkoutNamePlaceholder')} disabled={isProcessing} />
              </Field>
              <Field>
                <FieldLabel htmlFor="correo">C{t(lang,'checkoutEmail')}</FieldLabel>
                <Input id="correo" type="email" required defaultValue={userEmail} placeholder="correo@ejemplo.com" disabled={isProcessing} />
              </Field>
              <Field>
                <FieldLabel htmlFor="telefono">{t(lang,'checkoutPhone')}</FieldLabel>
                <Input id="telefono" type="tel" required defaultValue={userTel} placeholder="3312345678" disabled={isProcessing} />
              </Field>
            </FieldGroup>

            <Separator className="my-7" />

            <h2 className="mb-4 text-xl font-bold">{t(lang,'checkoutDelivery')}</h2>
            <div role="radiogroup" aria-label={t(lang,'checkoutDeliveryType')} className="grid gap-3 sm:grid-cols-2">
              {DELIVERY_OPTIONS.map((option) => (
                <label key={option.id} className={optionClass(deliveryType === option.id, isProcessing)}>
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
                    <span className="block text-sm font-bold">{t(lang, option.label as any)}</span>
                    <span className="block text-xs text-muted-foreground">{t(lang, option.description as any)}</span>
                  </span>
                </label>
              ))}
            </div>

            {deliveryType === 'SHIPPING' && (
              <Field className="mt-5">
                <FieldLabel htmlFor="direccion">{t(lang,'checkoutAddress')}</FieldLabel>
                <Textarea
                  id="direccion"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={t(lang,'checkoutAddressPlaceholder')}
                  disabled={isProcessing}
                />
              </Field>
            )}

            <Separator className="my-7" />

            <h2 className="mb-4 text-xl font-bold">{t(lang,'checkoutPaymentMethod')}</h2>
            <div role="radiogroup" aria-label="Método de pago" className="flex flex-col gap-3">
              {availableMethods.map((option) => (
                <label key={option.id} className={optionClass(paymentMethod === option.id, isProcessing)}>
                  <input
                    type="radio"
                    name="metodo"
                    value={option.id}
                    checked={paymentMethod === option.id}
                    onChange={() => setPaymentMethod(option.id)}
                    disabled={isProcessing}
                    className="mt-1 accent-foreground"
                  />
                  <span>
                    <span className="block text-sm font-bold">
                      {paymentLabel(option.id)}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {option.description}
                    </span>
                  </span>
                </label>
              ))}
            </div>

            <div className="mt-7 flex justify-end gap-2.5">
              <a
                href={localizeHref('/carrito', lang)}
                className={buttonVariants({ variant: 'outline', size: 'lg' })}
              >
                {t(lang, 'checkoutBackCart')}
              </a>

              <Button type="submit" size="lg" disabled={isProcessing || cart.length === 0}>
                {isProcessing
                  ? t(lang, 'checkoutProcessing')
                  : t(lang, 'checkoutContinue')}
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