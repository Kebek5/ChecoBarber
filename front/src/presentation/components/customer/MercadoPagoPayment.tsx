import { useEffect, useState } from 'react'
import { Payment, initMercadoPago } from '@mercadopago/sdk-react'
import { rejectionMessage, type BrickPaymentResult } from '@/domain/order/Payment'
import { paymentsApi } from '@/infrastructure/payments/paymentsApi'

interface MercadoPagoPaymentProps {
   referencia: string
   amount: number
   payerEmail: string
   publicKey: string
   onResult: (result: BrickPaymentResult) => void
   onError: (message: string) => void
}

let initializedKey = ''

/**
 * Mercado Pago Checkout API (Payment Brick): el cliente paga con tarjeta de crédito/débito o genera
 * una ficha para pagar en tienda de conveniencia sin salir del sitio.
 * El navegador solo obtiene un token de la tarjeta; el pago se crea en el backend (POST /v1/payments).
 */
export default function MercadoPagoPayment({
   referencia,
   amount,
   payerEmail,
   publicKey,
   onResult,
   onError,
}: MercadoPagoPaymentProps) {
   const [ready, setReady] = useState(false)

   useEffect(() => {
      if (!publicKey || initializedKey === publicKey) return
      initMercadoPago(publicKey, { locale: 'es-MX' })
      initializedKey = publicKey
   }, [publicKey])

   if (!publicKey) {
      return <p className="text-sm text-destructive">Falta configurar PUBLIC_MP_PUBLIC_KEY en el front.</p>
   }

   return (
      <div>
         {!ready && <p className="mb-3 text-sm text-muted-foreground">Cargando formulario de pago seguro...</p>}
         <Payment
            initialization={{ amount, payer: { email: payerEmail } }}
            customization={{
               paymentMethods: {
                  creditCard: 'all',
                  debitCard: 'all',
                  ticket: 'all',
                  maxInstallments: 1,
               },
            }}
            locale="es-MX"
            onReady={() => setReady(true)}
            onError={(error) => {
               console.error('[MercadoPago brick]', error)
               onError('No se pudo cargar el formulario de pago. Recarga la página e inténtalo de nuevo.')
            }}
            onSubmit={async ({ formData }) => {
               try {
                  const result = await paymentsApi.post<BrickPaymentResult>('mercadopago/pago', {
                     referencia,
                     formData,
                     // Lo genera el SDK de Mercado Pago; ayuda a prevenir fraude y a aprobar más pagos
                     deviceId: (window as unknown as { MP_DEVICE_SESSION_ID?: string }).MP_DEVICE_SESSION_ID,
                  })
                  onResult(result)
                  // Rechazado: se rechaza la promesa para que el Brick permita reintentar con otra tarjeta
                  if (result.estado === 'rechazado') throw new Error(rejectionMessage(result.statusDetail))
               } catch (err) {
                  const message = err instanceof Error ? err.message : 'No se pudo procesar el pago.'
                  onError(message)
                  throw err
               }
            }}
         />
      </div>
   )
}
