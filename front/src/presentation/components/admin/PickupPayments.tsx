import { useCallback, useEffect, useState } from 'react'
import { STORED_METHOD_LABEL, PAYMENT_STATUS_LABEL, type PaymentStatus, type StoredPaymentMethod } from '@/domain/order/Payment'
import { paymentsApi } from '@/infrastructure/payments/paymentsApi'
import { Badge } from '@/presentation/components/ui/badge'
import { Button } from '@/presentation/components/ui/button'
import { Card } from '@/presentation/components/ui/card'

interface PendingPickup {
  referencia: string
  fecha: string
  total: number
  metodoPago: StoredPaymentMethod
  estadoPago: PaymentStatus
  cobroEnTerminal: string | null
  cliente: { nombre: string; telefono: string }
}

interface Terminal {
  id: string
  operating_mode?: string
}

const POLL_MS = 4000

// Cobro de pedidos que se recogen en la barbería: terminal Mercado Pago Point o efectivo
export default function PickupPayments() {
   const [orders, setOrders] = useState<PendingPickup[]>([])
   const [terminals, setTerminals] = useState<Terminal[]>([])
   const [terminalId, setTerminalId] = useState('')
   const [busy, setBusy] = useState<string | null>(null)
   const [error, setError] = useState<string | null>(null)
   const [notice, setNotice] = useState<string | null>(null)

   const load = useCallback(async () => {
      try {
         const list = await paymentsApi.get<PendingPickup[]>('admin/pendientes')
         // Los cobros enviados a la terminal se sincronizan consultando su estado
         const inTerminal = list.filter((o) => o.cobroEnTerminal)
         if (inTerminal.length > 0) {
         await Promise.all(inTerminal.map((o) => paymentsApi.get(`estado/${o.referencia}`).catch(() => null)))
         setOrders(await paymentsApi.get<PendingPickup[]>('admin/pendientes'))
         } else {
         setOrders(list)
         }
      } catch (err) {
         setError(err instanceof Error ? err.message : 'No se pudieron cargar los pedidos.')
      }
   }, [])

   useEffect(() => {
      load()
      paymentsApi
         .get<Terminal[]>('admin/terminales')
         .then((list) => {
         setTerminals(list)
         if (list[0]) setTerminalId((current) => current || list[0].id)
         })
         .catch(() => setTerminals([]))
      const id = window.setInterval(load, POLL_MS)
      return () => window.clearInterval(id)
   }, [load])

   const run = async (key: string, action: () => Promise<unknown>, success: string) => {
      setBusy(key)
      setError(null)
      setNotice(null)
      try {
         await action()
         setNotice(success)
         await load()
      } catch (err) {
         setError(err instanceof Error ? err.message : 'La operación falló.')
      } finally {
         setBusy(null)
      }
   }

   return (
      <div className="flex flex-col gap-6">
         {error && (
         <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
         </p>
         )}
         {notice && (
         <p role="status" className="rounded-lg border bg-muted/50 p-3 text-sm">
            {notice}
         </p>
         )}

         <Card className="gap-3 p-5 shadow-[0_0_15px_#2222]">
         <h2 className="text-lg font-bold">Terminal Mercado Pago Point</h2>
         {terminals.length === 0 ? (
            <p className="text-sm text-muted-foreground">
               No hay terminales vinculadas a la cuenta, o falta MP_ACCESS_TOKEN en el backend. Puedes cobrar en efectivo.
            </p>
         ) : (
            <div className="flex flex-col gap-2.5">
               {terminals.map((terminal) => (
               <label key={terminal.id} className="flex flex-wrap items-center gap-3 text-sm">
                  <input
                     type="radio"
                     name="terminal"
                     checked={terminalId === terminal.id}
                     onChange={() => setTerminalId(terminal.id)}
                     className="accent-foreground"
                  />
                  <span className="font-mono">{terminal.id}</span>
                  <Badge variant="outline">{terminal.operating_mode ?? 'modo desconocido'}</Badge>
                  {terminal.operating_mode !== 'PDV' && (
                     <Button
                     variant="outline"
                     size="sm"
                     disabled={busy !== null}
                     onClick={() =>
                        run(`pdv-${terminal.id}`, () => paymentsApi.post('admin/terminales/pdv', { terminalId: terminal.id }),
                           'Modo PDV activado. Reinicia la terminal si te lo pide.')
                     }
                     >
                     Activar modo PDV
                     </Button>
                  )}
               </label>
               ))}
            </div>
         )}
         </Card>

         <Card className="gap-0 overflow-x-auto p-0 shadow-[0_0_15px_#2222]">
         <table className="w-full min-w-175 text-left text-sm">
            <thead className="border-b bg-muted/40">
               <tr>
               <th className="p-3">Referencia</th>
               <th className="p-3">Cliente</th>
               <th className="p-3">Total</th>
               <th className="p-3">Método</th>
               <th className="p-3">Estado</th>
               <th className="p-3 text-right">Cobrar</th>
               </tr>
            </thead>
            <tbody>
               {orders.length === 0 && (
               <tr>
                  <td colSpan={6} className="p-6 text-center text-muted-foreground">
                     No hay pedidos para recoger pendientes de pago.
                  </td>
               </tr>
               )}
               {orders.map((order) => (
               <tr key={order.referencia} className="border-b last:border-b-0">
                  <td className="p-3 font-mono">
                     <a href={`/pedido/${order.referencia}`} className="underline" target="_blank" rel="noopener noreferrer">
                     {order.referencia}
                     </a>
                     <small className="block text-muted-foreground">{order.fecha}</small>
                  </td>
                  <td className="p-3">
                     {order.cliente.nombre}
                     <small className="block text-muted-foreground">{order.cliente.telefono}</small>
                  </td>
                  <td className="p-3 font-bold">${order.total.toFixed(2)}</td>
                  <td className="p-3">{STORED_METHOD_LABEL[order.metodoPago]}</td>
                  <td className="p-3">
                     <Badge variant="outline">
                     {order.cobroEnTerminal ? 'En terminal' : PAYMENT_STATUS_LABEL[order.estadoPago]}
                     </Badge>
                  </td>
                  <td className="p-3">
                     <div className="flex flex-wrap justify-end gap-2">
                     {order.cobroEnTerminal ? (
                        <Button
                           variant="outline"
                           size="sm"
                           disabled={busy !== null}
                           onClick={() =>
                           run(`cancel-${order.referencia}`, () => paymentsApi.post('admin/terminal/cancelar', { referencia: order.referencia }),
                              'Cobro cancelado en la terminal.')
                           }
                        >
                           Cancelar cobro
                        </Button>
                     ) : (
                        <Button
                           size="sm"
                           disabled={busy !== null || terminals.length === 0}
                           onClick={() =>
                           run(`term-${order.referencia}`, () => paymentsApi.post('admin/terminal', { referencia: order.referencia, terminalId }),
                              'Cobro enviado. Pide al cliente que acerque su tarjeta a la terminal.')
                           }
                        >
                           Cobrar en terminal
                        </Button>
                     )}
                     <Button
                        variant="outline"
                        size="sm"
                        disabled={busy !== null}
                        onClick={() =>
                           run(`cash-${order.referencia}`, () => paymentsApi.post('admin/efectivo', { referencia: order.referencia }),
                           `Pago en efectivo registrado para ${order.referencia}.`)
                        }
                     >
                        Recibí efectivo
                     </Button>
                     </div>
                  </td>
               </tr>
               ))}
            </tbody>
         </table>
         </Card>
      </div>
   )
}