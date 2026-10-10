import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js'
import type { PaymentStatus } from '@/domain/order/Payment'
import { paymentsApi } from '@/infrastructure/payments/paymentsApi'

interface PayPalPaymentProps {
   referencia: string
   clientId: string
   onPaid: (estado: PaymentStatus) => void
   onError: (message: string) => void
}

// Botón de PayPal: cuenta PayPal o tarjeta como invitado. La orden se crea y captura en el backend.
export default function PayPalPayment({ referencia, clientId, onPaid, onError }: PayPalPaymentProps) {
   if (!clientId) {
      return <p className="text-sm text-destructive">Falta configurar PUBLIC_PAYPAL_CLIENT_ID en el front.</p>
   }

   return (
      <PayPalScriptProvider options={{ clientId, currency: 'MXN', intent: 'capture', locale: 'es_MX' }}>
         <PayPalButtons
         style={{ layout: 'vertical', shape: 'rect', label: 'pay' }}
         createOrder={async () => {
            const order = await paymentsApi.post<{ id: string }>('paypal/orden', { referencia })
            return order.id
         }}
         onApprove={async (data) => {
            try {
               const result = await paymentsApi.post<{ estado: PaymentStatus }>('paypal/capturar', {
               referencia,
               paypalOrderId: data.orderID,
               })
               onPaid(result.estado)
            } catch (err) {
               onError(err instanceof Error ? err.message : 'No se pudo completar el pago con PayPal.')
            }
         }}
         onCancel={() => onError('Cancelaste el pago con PayPal. Puedes intentarlo de nuevo.')}
         onError={(err) => {
            console.error('[PayPal]', err)
            onError('PayPal no pudo procesar el pago. Intenta de nuevo.')
         }}
         />
      </PayPalScriptProvider>
   )
}