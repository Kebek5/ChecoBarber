import { useEffect, useState } from 'react'
import { EMPTY_FISCAL, type DatosFiscales } from '@/domain/order/Fiscal'
import { paymentsApi } from '@/infrastructure/payments/paymentsApi'
import { Button } from '@/presentation/components/ui/button'
import FiscalFields from './FiscalFields'
import { isOfflineError, queueRequest } from '@/pwa/client'
import { t, type Lang } from '@/i18n/ui'

interface Props {
   lang?: Lang
}

export default function DatosFiscalesForm({ lang = 'es' }: Props) {
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

         setSuccess(t(lang, 'fiscalSaved'))
      } catch (err) {
         if (isOfflineError(err)) {
            // Sin red: se guarda en la cola y el Service Worker lo envía
            // cuando vuelva la conexión.
            await queueRequest('/api/pagos/datos-fiscales', 'POST', value)

            setSuccess(t(lang, 'fiscalOffline'))
         } else {
            setError(
               err instanceof Error
                  ? err.message
                  : t(lang, 'fiscalSaveError')
            )
         }
      } finally {
         setBusy(false)
      }
   }

   if (loading) {
      return (
         <p className="text-xs text-muted-foreground">
            {t(lang, 'fiscalLoading')}
         </p>
      )
   }

   return (
      <div className="flex flex-col gap-4">
         {error && (
            <div
               className="border border-destructive/40 bg-destructive/10 p-2.5 text-xs text-destructive"
               role="alert"
            >
               {error}
            </div>
         )}

         {success && (
            <div
               className="border border-green-600/40 bg-green-600/10 p-2.5 text-xs text-green-700"
               role="status"
            >
               {success}
            </div>
         )}

         <FiscalFields
            value={value}
            onChange={setValue}
            lang={lang}
         />

         <div>
            <Button disabled={busy} onClick={save}>
               {busy
                  ? t(lang, 'fiscalSaving')
                  : t(lang, 'fiscalSave')}
            </Button>
         </div>
      </div>
   )
}