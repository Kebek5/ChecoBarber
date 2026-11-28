import { useCallback, useEffect, useState } from 'react'
import {
   PAYMENT_STATUS_LABEL,
   STORED_METHOD_LABEL,
   eventLabel,
   type BrickPaymentResult,
   type TrackedOrder,
} from '@/domain/order/Payment'
import { paymentsApi } from '@/infrastructure/payments/paymentsApi'
import { Badge } from '@/presentation/components/ui/badge'
import { Button } from '@/presentation/components/ui/button'
import { Card } from '@/presentation/components/ui/card'
import { Separator } from '@/presentation/components/ui/separator'
import MercadoPagoPayment from './MercadoPagoPayment.tsx'
import PayPalPayment from './PayPalPayment.tsx'
import { t, type Lang } from '@/i18n/ui'
import { localizeHref } from '@/i18n/routes'

interface OrderTrackingProps {
   initial: TrackedOrder
   isLoggedIn: boolean
   paypalClientId: string
   mpPublicKey: string
   userEmail: string
   lang?: Lang
}

const POLL_MS = 5000

const money = (value: number) =>
   `$${value.toFixed(2)}`

const dateTime = (iso: string, lang: Lang) =>
   new Date(iso).toLocaleString(
      lang === 'en' ? 'en-US' : 'es-MX',
      {
         dateStyle: 'medium',
         timeStyle: 'short',
      }
   )

export default function OrderTracking({
   initial,
   isLoggedIn,
   paypalClientId,
   mpPublicKey,
   userEmail,
   lang = 'es',
}: OrderTrackingProps) {
   const [order, setOrder] = useState<TrackedOrder>(initial)
   const [message, setMessage] = useState<string | null>(null)
   const [error, setError] = useState<string | null>(null)
   const [ticketUrl, setTicketUrl] = useState<string | null>(null)
   const [copied, setCopied] = useState(false)

   const refresh = useCallback(async () => {
      try {
         const updated = await paymentsApi.get<TrackedOrder>(
            `estado/${encodeURIComponent(order.referencia)}`
         )

         setOrder((current) =>
            JSON.stringify(current) === JSON.stringify(updated)
               ? current
               : updated
         )
      } catch {
         // Se reintenta en el siguiente ciclo.
      }
   }, [order.referencia])

   // Mientras el pago esté pendiente o rechazado se consulta
   // el estado cada cinco segundos.
   const waiting =
      order.estadoPago === 'pendiente' ||
      order.estadoPago === 'rechazado'

   useEffect(() => {
      if (!waiting) return

      const id = window.setInterval(refresh, POLL_MS)

      return () => window.clearInterval(id)
   }, [waiting, refresh])

   const handleMercadoPagoResult = (result: BrickPaymentResult) => {
      setError(null)

      if (result.ticketUrl) {
         setTicketUrl(result.ticketUrl)
      }

      if (result.estado === 'aprobado') {
         setMessage(t(lang, 'orderApprovedMessage'))
      } else if (result.estado === 'pendiente') {
         setMessage(
            result.tipo === 'ticket'
               ? t(lang, 'orderPendingTicket')
               : t(lang, 'orderPendingReview')
         )
      }

      refresh()
   }

   const copyTrackingLink = async () => {
      try {
         await navigator.clipboard.writeText(window.location.href)
         setCopied(true)

         window.setTimeout(() => setCopied(false), 2000)
      } catch {
         setError(t(lang, 'orderCopyError'))
      }
   }

   const canPayOnline =
      isLoggedIn &&
      waiting &&
      ['mercadopago', 'paypal'].includes(order.metodoPago)

   const deliveryLabel =
      order.tipoEntrega === 'recoger'
         ? t(lang, 'orderPaymentPickup')
         : t(lang, 'orderPaymentShipping')

   const statusMessages: Record<string, { title: string; description: string }> = {
      aprobado: {
         title: t(lang, 'orderConfirmed'),
         description:
            order.tipoEntrega === 'recoger'
               ? t(lang, 'orderPickupReady')
               : t(lang, 'orderShippingReady'),
      },
      cancelado: {
         title: t(lang, 'orderCancelled'),
         description: t(lang, 'orderExpired'),
      },
      reembolsado: {
         title: t(lang, 'orderRefunded'),
         description: t(lang, 'orderRefundMessage'),
      },
   }

   const currentStatus = statusMessages[order.estadoPago]

   const methodLabel =
      order.metodoPago === 'mercadopago'
         ? t(lang, 'orderMethodMercadoPago')
         : order.metodoPago === 'paypal'
            ? t(lang, 'orderMethodPayPal')
            : order.metodoPago === 'terminal'
               ? t(lang, 'orderMethodTerminal')
               : order.metodoPago === 'efectivo'
                  ? t(lang, 'orderMethodCash')
                  : order.metodoPago === 'link'
                     ? t(lang, 'orderMethodLink')
                     : STORED_METHOD_LABEL[order.metodoPago]

   return (
      <div className="mx-auto w-full max-w-300 px-7.5 py-12.5">
         <div className="mb-8">
            <Badge
               variant="outline"
               className="mb-2.5 uppercase tracking-wider"
            >
               {t(lang, 'purchasesOrder')} {order.referencia}
            </Badge>

            <h1 className="mb-2 text-[clamp(30px,5vw,48px)] font-bold leading-tight">
               {PAYMENT_STATUS_LABEL[order.estadoPago]}
            </h1>

            <p className="text-muted-foreground">
               {methodLabel} · {deliveryLabel}
            </p>
         </div>

         <div className="grid items-start gap-7.5 lg:grid-cols-[1fr_350px]">
            <Card className="p-6 shadow-[0_0_15px_#2222]">
               {message && (
                  <p
                     role="status"
                     className="mb-5 rounded-lg border bg-muted/50 p-3 text-sm"
                  >
                     {message}
                  </p>
               )}

               {error && (
                  <p
                     role="alert"
                     className="mb-5 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
                  >
                     {error}
                  </p>
               )}

               {currentStatus && (
                  <div>
                     <h2 className="mb-2 text-xl font-bold">
                        {currentStatus.title}
                     </h2>

                     <p className="text-muted-foreground">
                        {currentStatus.description}{' '}

                        {order.estadoPago === 'aprobado' &&
                           order.tipoEntrega === 'recoger' && (
                              <>
                                 {t(lang, 'orderMentionReference')}{' '}
                                 <strong>{order.referencia}</strong>.
                              </>
                           )}
                     </p>
                  </div>
               )}

               {waiting &&
                  (order.metodoPago === 'terminal' ||
                     order.metodoPago === 'efectivo') && (
                     <div>
                        <h2 className="mb-2 text-xl font-bold">
                           {order.metodoPago === 'terminal'
                              ? t(lang, 'orderPayTerminal')
                              : t(lang, 'orderPayCash')}
                        </h2>

                        <p className="text-muted-foreground">
                           {order.metodoPago === 'terminal'
                              ? t(lang, 'orderPayPickup')
                              : t(lang, 'orderPayCash')}{' '}

                           {t(lang, 'orderMentionReference')}{' '}
                           <strong>{order.referencia}</strong>.
                        </p>
                     </div>
                  )}

               {waiting &&
                  !isLoggedIn &&
                  order.metodoPago !== 'terminal' &&
                  order.metodoPago !== 'efectivo' && (
                     <p className="text-muted-foreground">
                        <a
                           href={localizeHref(
                              `/login?next=/pedido/${order.referencia}`,
                              lang
                           )}
                           className="underline"
                        >
                           {t(lang, 'orderLogin')}
                        </a>{' '}
                        {t(lang, 'orderLoginToPay')}
                     </p>
                  )}

               {waiting && order.metodoPago === 'link' && (
                  <p className="text-muted-foreground">
                     {t(lang, 'orderLinkUnavailable')}
                  </p>
               )}

               {canPayOnline &&
                  order.metodoPago === 'mercadopago' && (
                     <div className="flex flex-col gap-3">
                        <h2 className="text-xl font-bold">
                           {t(lang, 'orderPayMercadoPago')}
                        </h2>

                        {(ticketUrl ??
                           (order.estadoPago === 'pendiente'
                              ? order.urlPago
                              : null)) && (
                           <p className="rounded-lg border bg-muted/50 p-3 text-sm">
                              {t(lang, 'orderPendingTicket')}{' '}

                              <a
                                 href={ticketUrl ?? order.urlPago ?? '#'}
                                 target="_blank"
                                 rel="noopener noreferrer"
                                 className="font-bold underline"
                              >
                                 {t(lang, 'orderViewTicket')}
                              </a>

                              . {t(lang, 'orderPayCardBelow')}
                           </p>
                        )}

                        <MercadoPagoPayment
                           referencia={order.referencia}
                           amount={order.total}
                           payerEmail={userEmail}
                           publicKey={mpPublicKey}
                           onResult={handleMercadoPagoResult}
                           onError={setError}
                        />
                     </div>
                  )}

               {canPayOnline &&
                  order.metodoPago === 'paypal' && (
                     <div>
                        <h2 className="mb-4 text-xl font-bold">
                           {t(lang, 'orderPayPayPal')}
                        </h2>

                        <PayPalPayment
                           referencia={order.referencia}
                           clientId={paypalClientId}
                           onPaid={(estado) => {
                              setError(null)

                              setMessage(
                                 estado === 'aprobado'
                                    ? t(lang, 'orderApprovedMessage')
                                    : t(lang, 'orderPendingReview')
                              )

                              refresh()
                           }}
                           onError={setError}
                        />
                     </div>
                  )}

               <Separator className="my-6" />

               <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">
                     {t(lang, 'orderSaveLink')}
                  </p>

                  <Button
                     variant="outline"
                     onClick={copyTrackingLink}
                  >
                     {copied
                        ? t(lang, 'orderCopied')
                        : t(lang, 'orderCopyTracking')}
                  </Button>
               </div>
            </Card>

            <div className="flex flex-col gap-5">
               <Card className="gap-0 bg-muted/40 p-6 shadow-[0_0_15px_#2222]">
                  <h2 className="mb-5 text-xl font-bold">
                     {t(lang, 'orderSummary')}
                  </h2>

                  <ul className="flex flex-col gap-3">
                     {order.lineas.map((line, index) => (
                        <li
                           key={index}
                           className="flex justify-between gap-2.5 border-b pb-2.5"
                        >
                           <div>
                              <p className="text-sm font-medium">
                                 {line.producto}
                              </p>

                              <small className="text-muted-foreground">
                                 {line.cantidad} × {money(line.precioUnitario)}
                              </small>
                           </div>

                           <strong className="whitespace-nowrap">
                              {money(line.cantidad * line.precioUnitario)}
                           </strong>
                        </li>
                     ))}
                  </ul>

                  <div className="flex justify-between pt-4">
                     <span>{t(lang, 'total')}</span>

                     <strong className="text-xl">
                        {money(order.total)}
                     </strong>
                  </div>
               </Card>

               <Card className="gap-0 p-6 shadow-[0_0_15px_#2222]">
                  <h2 className="mb-4 text-lg font-bold">
                     {t(lang, 'orderHistory')}
                  </h2>

                  <ol className="flex flex-col gap-3 border-l pl-4">
                     {order.eventos.map((event, index) => (
                        <li key={index} className="text-sm">
                           <p className="font-medium">
                              {eventLabel(event.evento)}
                           </p>

                           <small className="text-muted-foreground">
                              {dateTime(event.fecha, lang)}
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