import { useCallback, useEffect, useState } from 'react'
import {
   PAYMENT_STATUS_LABEL,
   STORED_METHOD_LABEL,
   eventLabel,
   rejectionMessage,
   type BrickPaymentResult,
   type TrackedOrder,
} from '@/domain/order/Payment'
import { paymentsApi } from '@/infrastructure/payments/paymentsApi'
import { Badge } from '@/presentation/components/ui/badge'
import { Button, buttonVariants } from '@/presentation/components/ui/button'
import { Card } from '@/presentation/components/ui/card'
import { Separator } from '@/presentation/components/ui/separator'
import MercadoPagoPayment from './MercadoPagoPayment.tsx'
import PayPalPayment from './PayPalPayment.tsx'

interface OrderTrackingProps {
   initial: TrackedOrder
   isLoggedIn: boolean
   payerEmail: string
   mpPublicKey: string
   paypalClientId: string
}

const POLL_MS = 5000
const money = (value: number) => `$${value.toFixed(2)}`
const dateTime = (iso: string) =>
   new Date(iso).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })

export default function OrderTracking({ initial, isLoggedIn, payerEmail, mpPublicKey, paypalClientId }: OrderTrackingProps) {
   const [order, setOrder] = useState<TrackedOrder>(initial)
   const [message, setMessage] = useState<string | null>(null)
   const [error, setError] = useState<string | null>(null)
   const [brickKey, setBrickKey] = useState(0) // cambiarlo vuelve a montar el Brick para reintentar
   const [showBrick, setShowBrick] = useState(!initial.urlPago)
   const [loadingLink, setLoadingLink] = useState(false)
   const [copied, setCopied] = useState(false)

   const refresh = useCallback(async () => {
      try {
         setOrder(await paymentsApi.get<TrackedOrder>(`estado/${encodeURIComponent(order.referencia)}`))
      } catch {
         // Si falla una consulta se reintenta en el siguiente ciclo
      }
   }, [order.referencia])

   // Mientras el pago esté pendiente se consulta el estado cada 5 segundos
   const waiting = order.estadoPago === 'pendiente' || order.estadoPago === 'rechazado'
   useEffect(() => {
      if (!waiting) return
      const id = window.setInterval(refresh, POLL_MS)
      return () => window.clearInterval(id)
   }, [waiting, refresh])

   const handleBrickResult = (result: BrickPaymentResult) => {
      setError(null)
      if (result.estado === 'aprobado') {
         setMessage('Pago aprobado. Gracias por tu compra.')
      } else if (result.estado === 'rechazado') {
         setError(rejectionMessage(result.statusDetail))
         setBrickKey((k) => k + 1)
      } else if (result.ticketUrl) {
         setMessage('Tu ficha de pago está lista. Págala antes de que venza para confirmar tu pedido.')
         setShowBrick(false)
      } else {
         setMessage('Tu pago está en revisión. Te avisaremos aquí cuando se confirme.')
      }
      refresh()
   }

   const openPaymentLink = async () => {
      setLoadingLink(true)
      setError(null)
      try {
         const { url } = await paymentsApi.post<{ url: string }>('mercadopago/link', { referencia: order.referencia })
         window.location.href = url
      } catch (err) {
         setError(err instanceof Error ? err.message : 'No se pudo generar el link de pago.')
         setLoadingLink(false)
      }
   }

   const copyTrackingLink = async () => {
      try {
         await navigator.clipboard.writeText(window.location.href)
         setCopied(true)
         window.setTimeout(() => setCopied(false), 2000)
      } catch {
         setError('No se pudo copiar el enlace.')
      }
   }

   const canPayOnline = isLoggedIn && waiting && ['mercadopago', 'link', 'paypal'].includes(order.metodoPago)

   return (
      <div className="mx-auto w-full max-w-300 px-7.5 py-12.5">
         <div className="mb-8">
         <Badge variant="outline" className="mb-2.5 uppercase tracking-wider">
            Pedido {order.referencia}
         </Badge>
         <h1 className="mb-2 text-[clamp(30px,5vw,48px)] font-bold leading-tight">{PAYMENT_STATUS_LABEL[order.estadoPago]}</h1>
         <p className="text-muted-foreground">
            {STORED_METHOD_LABEL[order.metodoPago]} · {order.tipoEntrega === 'recoger' ? 'Recoger en la barbería' : 'Envío a domicilio'}
         </p>
         </div>

         <div className="grid items-start gap-7.5 lg:grid-cols-[1fr_350px]">
         <Card className="p-6 shadow-[0_0_15px_#2222]">
            {message && (
               <p role="status" className="mb-5 rounded-lg border bg-muted/50 p-3 text-sm">
               {message}
               </p>
            )}
            {error && (
               <p role="alert" className="mb-5 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
               {error}
               </p>
            )}

            {order.estadoPago === 'aprobado' && (
               <div>
               <h2 className="mb-2 text-xl font-bold">Pago confirmado</h2>
               <p className="text-muted-foreground">
                  {order.tipoEntrega === 'recoger'
                     ? 'Tu pedido estará listo para recoger en la barbería. Menciona tu referencia.'
                     : 'Estamos preparando tu pedido para enviarlo.'}
               </p>
               </div>
            )}

            {order.estadoPago === 'cancelado' && (
               <div>
               <h2 className="mb-2 text-xl font-bold">Pedido cancelado</h2>
               <p className="text-muted-foreground">El plazo para pagar venció y los productos se liberaron. Puedes hacer un nuevo pedido.</p>
               </div>
            )}

            {order.estadoPago === 'reembolsado' && (
               <div>
               <h2 className="mb-2 text-xl font-bold">Pago reembolsado</h2>
               <p className="text-muted-foreground">El importe se devolvió al medio de pago original.</p>
               </div>
            )}

            {waiting && (order.metodoPago === 'terminal' || order.metodoPago === 'efectivo') && (
               <div>
               <h2 className="mb-2 text-xl font-bold">Paga al recoger</h2>
               <p className="text-muted-foreground">
                  {order.metodoPago === 'terminal'
                     ? 'Paga con tarjeta en la terminal de la barbería al recoger tu pedido.'
                     : 'Paga en efectivo en la barbería al recoger tu pedido.'}{' '}
                  Menciona la referencia <strong>{order.referencia}</strong>.
               </p>
               </div>
            )}

            {waiting && !isLoggedIn && order.metodoPago !== 'terminal' && order.metodoPago !== 'efectivo' && (
               <p className="text-muted-foreground">
               <a href={`/login?next=/pedido/${order.referencia}`} className="underline">Inicia sesión</a> para pagar este pedido.
               </p>
            )}

            {canPayOnline && order.metodoPago === 'mercadopago' && (
               <div>
               <h2 className="mb-4 text-xl font-bold">Pagar con tarjeta o en tienda</h2>

               {order.urlPago && !showBrick ? (
                  <div className="flex flex-col gap-3">
                     <p className="text-muted-foreground">
                     Ya generaste una ficha de pago. Ábrela para ver el código y págala en la tienda antes de que venza.
                     </p>
                     <div className="flex flex-wrap gap-2.5">
                     <a href={order.urlPago} target="_blank" rel="noopener noreferrer" className={buttonVariants({ size: 'lg' })}>
                        Ver ficha de pago
                     </a>
                     <Button variant="outline" size="lg" onClick={() => setShowBrick(true)}>
                        Pagar con otro medio
                     </Button>
                     </div>
                  </div>
               ) : (
                  <MercadoPagoPayment
                     key={brickKey}
                     referencia={order.referencia}
                     amount={order.total}
                     email={payerEmail}
                     publicKey={mpPublicKey}
                     onResult={handleBrickResult}
                     onError={(msg) => {
                     setError(msg)
                     setBrickKey((k) => k + 1)
                     }}
                  />
               )}
               </div>
            )}

            {canPayOnline && order.metodoPago === 'link' && (
               <div className="flex flex-col gap-3">
               <h2 className="text-xl font-bold">Link de pago</h2>
               <p className="text-muted-foreground">
                  Te llevamos a Mercado Pago para pagar con tarjeta, saldo o en efectivo. Al terminar regresarás a esta página,
                  que muestra el estado del pago en tiempo real.
               </p>
               <div>
                  <Button size="lg" onClick={openPaymentLink} disabled={loadingLink}>
                     {loadingLink ? 'Generando link...' : order.urlPago ? 'Ir a pagar' : 'Generar link y pagar'}
                  </Button>
               </div>
               </div>
            )}

            {canPayOnline && order.metodoPago === 'paypal' && (
               <div>
               <h2 className="mb-4 text-xl font-bold">Pagar con PayPal</h2>
               <PayPalPayment
                  referencia={order.referencia}
                  clientId={paypalClientId}
                  onPaid={(estado) => {
                     setError(null)
                     setMessage(estado === 'aprobado' ? 'Pago aprobado. Gracias por tu compra.' : 'Tu pago está en revisión.')
                     refresh()
                  }}
                  onError={setError}
               />
               </div>
            )}

            <Separator className="my-6" />

            <div className="flex flex-wrap items-center justify-between gap-3">
               <p className="text-sm text-muted-foreground">Guarda o comparte este enlace para seguir el estado del pedido.</p>
               <Button variant="outline" onClick={copyTrackingLink}>
               {copied ? 'Enlace copiado' : 'Copiar enlace de seguimiento'}
               </Button>
            </div>
         </Card>

         <div className="flex flex-col gap-5">
            <Card className="gap-0 bg-muted/40 p-6 shadow-[0_0_15px_#2222]">
               <h2 className="mb-5 text-xl font-bold">Resumen</h2>
               <ul className="flex flex-col gap-3">
               {order.lineas.map((line, index) => (
                  <li key={index} className="flex justify-between gap-2.5 border-b pb-2.5">
                     <div>
                     <p className="text-sm font-medium">{line.producto}</p>
                     <small className="text-muted-foreground">
                        {line.cantidad} × {money(line.precioUnitario)}
                     </small>
                     </div>
                     <strong className="whitespace-nowrap">{money(line.cantidad * line.precioUnitario)}</strong>
                  </li>
               ))}
               </ul>
               <div className="flex justify-between pt-4">
               <span>Total</span>
               <strong className="text-xl">{money(order.total)}</strong>
               </div>
            </Card>

            <Card className="gap-0 p-6 shadow-[0_0_15px_#2222]">
               <h2 className="mb-4 text-lg font-bold">Historial</h2>
               <ol className="flex flex-col gap-3 border-l pl-4">
               {order.eventos.map((event, index) => (
                  <li key={index} className="text-sm">
                     <p className="font-medium">{eventLabel(event.evento)}</p>
                     <small className="text-muted-foreground">
                     {dateTime(event.fecha)}
                     {event.estado ? ` · ${event.estado}` : ''}
                     </small>
                  </li>
               ))}
               </ol>
            </Card>
         </div>
         </div>
      </div>
   )
}