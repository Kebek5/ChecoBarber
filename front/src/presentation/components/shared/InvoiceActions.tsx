import { useState } from 'react'
import { paymentsApi } from '@/infrastructure/payments/paymentsApi'
import { Button } from '@/presentation/components/ui/button'

export default function InvoiceActions({ reference }: { reference: string }) {
   const [busy, setBusy] = useState(false)
   const [message, setMessage] = useState('')
   const [error, setError] = useState('')

   async function download() {
      setError('')
      setMessage('')
      try {
         const res = await fetch(`/api/pagos/factura/${reference}`)
         if (!res.ok) {
            const data = await res.json().catch(() => null)
            throw new Error(data?.error ?? 'No se pudo descargar la factura.')
         }
         const url = URL.createObjectURL(await res.blob())
         const a = document.createElement('a')
         a.href = url
         a.download = `factura-${reference}.xml`
         a.click()
         URL.revokeObjectURL(url)
      } catch (err) {
         setError(err instanceof Error ? err.message : 'No se pudo descargar la factura.')
      }
   }

   async function send() {
      setBusy(true)
      setError('')
      setMessage('')
      try {
         await paymentsApi.post(`factura/${reference}/reenviar`, {})
         setMessage('Te enviamos la factura a tu correo.')
      } catch (err) {
         setError(err instanceof Error ? err.message : 'No se pudo enviar la factura.')
      } finally {
         setBusy(false)
      }
   }

   return (
      <div className="flex flex-col items-end gap-1">
         <div className="flex gap-2">
            <Button size="lg" variant="outline" onClick={download}>Descargar factura</Button>
            <Button size="lg" variant="outline" disabled={busy} onClick={send}>
               {busy ? 'Enviando…' : 'Enviar a mi correo'}
            </Button>
         </div>
         {message && <span className="text-xs text-green-700">{message}</span>}
         {error && <span className="text-xs text-destructive">{error}</span>}
      </div>
   )
}