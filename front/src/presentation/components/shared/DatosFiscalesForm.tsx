import { useEffect, useState } from 'react'
import { EMPTY_FISCAL, type DatosFiscales } from '@/domain/order/Fiscal'
import { paymentsApi } from '@/infrastructure/payments/paymentsApi'
import { Button } from '@/presentation/components/ui/button'
import FiscalFields from './FiscalFields'

export default function DatosFiscalesForm() {
   const [value, setValue] = useState<DatosFiscales>(EMPTY_FISCAL)
   const [loading, setLoading] = useState(true)
   const [busy, setBusy] = useState(false)
   const [error, setError] = useState('')
   const [success, setSuccess] = useState('')

   useEffect(() => {
      paymentsApi
         .get<DatosFiscales | null>('datos-fiscales')
         .then((d) => d && setValue(d))
         .catch(() => {})
         .finally(() => setLoading(false))
   }, [])

   async function save() {
      setBusy(true)
      setError('')
      setSuccess('')
      try {
         await paymentsApi.post('datos-fiscales', value)
         setSuccess('Datos fiscales guardados. Se usarán en tus próximas facturas.')
      } catch (err) {
         setError(err instanceof Error ? err.message : 'No se pudieron guardar.')
      } finally {
         setBusy(false)
      }
   }

   if (loading) return <p className="text-xs text-muted-foreground">Cargando…</p>

   return (
      <div className="flex flex-col gap-4">
         {error && <div className="border border-destructive/40 bg-destructive/10 p-2.5 text-xs text-destructive" role="alert">{error}</div>}
         {success && <div className="border border-green-600/40 bg-green-600/10 p-2.5 text-xs text-green-700" role="status">{success}</div>}
         <FiscalFields value={value} onChange={setValue} />
         <div>
            <Button disabled={busy} onClick={save}>{busy ? 'Guardando…' : 'Guardar datos fiscales'}</Button>
         </div>
      </div>
   )
}