import { initMercadoPago, Payment } from '@mercadopago/sdk-react'
import { useMemo } from 'react'
import type { BrickPaymentResult } from '@/domain/order/Payment'
import { paymentsApi } from '@/infrastructure/payments/paymentsApi'

interface MercadoPagoPaymentProps {
   referencia: string
   amount: number
   email: string
   publicKey: string
   onResult: (result: BrickPaymentResult) => void
   onError: (message: string) => void
}

let initializedKey: string | null = null

// Payment Brick: tarjeta de crédito, débito y tiendas de conveniencia (OXXO, Paycash)
export default function MercadoPagoPayment({ referencia, amount, email, publicKey, onResult, onError }: MercadoPagoPaymentProps) {
    // initMercadoPago se llama una sola vez por llave pública
   useMemo(() => {
      if (publicKey && initializedKey !== publicKey) {
         initMercadoPago(publicKey, { locale: 'es-MX' })
         initializedKey = publicKey
      }
   }, [publicKey])

   if (!publicKey) {
      return <p className="text-sm text-destructive">Falta configurar PUBLIC_MP_PUBLIC_KEY en el front.</p>
   }

   return (
      <Payment
         initialization={{ amount, payer: email ? { email } : undefined }}
         customization={{
         paymentMethods: {
            creditCard: 'all',
            debitCard: 'all',
            ticket: 'all', // OXXO y Paycash (7-Eleven, Circle K, Soriana, Extra, Kiosko...)
            maxInstallments: 12,
         },
         visual: { style: { theme: 'default' } },
         }}
         onSubmit={async ({ formData }) => {
         try {
            // El monto que manda el Brick se ignora: el backend usa el total del pedido
            const result = await paymentsApi.post<BrickPaymentResult>('mercadopago/pago', { referencia, formData })
            onResult(result)
         } catch (err) {
            onError(err instanceof Error ? err.message : 'No se pudo procesar el pago.')
         }
         }}
         onError={(error) => console.error('[Payment Brick]', error)}
      />
   )
}