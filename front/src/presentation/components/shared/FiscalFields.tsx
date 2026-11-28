import type { ChangeEvent } from 'react'
import { REGIMENES, USOS_CFDI, type DatosFiscales } from '@/domain/order/Fiscal'
import { t, type Lang } from '@/i18n/ui'

const field = 'w-full border px-2 py-1.5 text-xs'

interface Props {
   value: DatosFiscales
   onChange: (value: DatosFiscales) => void
   lang?: Lang
}

export default function FiscalFields({
   value,
   onChange,
   lang = 'es',
}: Props) {
   const set =
      (key: keyof DatosFiscales) =>
      (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
         onChange({ ...value, [key]: e.target.value })

   return (
      <div className="grid gap-3 sm:grid-cols-2">
         <label className="flex flex-col gap-1 text-xs font-bold">
            {t(lang, 'fiscalRFC')}

            <input
               className={field}
               value={value.rfc}
               maxLength={13}
               onChange={(e) =>
                  onChange({
                     ...value,
                     rfc: e.target.value.toUpperCase(),
                  })
               }
            />
         </label>

         <label className="flex flex-col gap-1 text-xs font-bold">
            {t(lang, 'fiscalPostalCode')}

            <input
               className={field}
               value={value.codigoPostal}
               maxLength={5}
               inputMode="numeric"
               onChange={set('codigoPostal')}
            />
         </label>

         <label className="flex flex-col gap-1 text-xs font-bold sm:col-span-2">
            {t(lang, 'fiscalBusinessName')}

            <input
               className={field}
               value={value.razonSocial}
               onChange={set('razonSocial')}
            />
         </label>

         <label className="flex flex-col gap-1 text-xs font-bold">
            {t(lang, 'fiscalRegime')}

            <select
               className={field}
               value={value.regimenFiscal}
               onChange={set('regimenFiscal')}
            >
               {REGIMENES.map((r) => (
                  <option key={r.id} value={r.id}>
                     {r.label}
                  </option>
               ))}
            </select>
         </label>

         <label className="flex flex-col gap-1 text-xs font-bold">
            {t(lang, 'fiscalCfdi')}

            <select
               className={field}
               value={value.usoCfdi}
               onChange={set('usoCfdi')}
            >
               {USOS_CFDI.map((u) => (
                  <option key={u.id} value={u.id}>
                     {u.label}
                  </option>
               ))}
            </select>
         </label>
      </div>
   )
}