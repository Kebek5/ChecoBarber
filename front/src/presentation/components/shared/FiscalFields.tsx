import type { ChangeEvent } from 'react'
import { REGIMENES, USOS_CFDI, type DatosFiscales } from '@/domain/order/Fiscal'

const field = 'w-full border px-2 py-1.5 text-xs'

interface Props {
   value: DatosFiscales
   onChange: (value: DatosFiscales) => void
}

export default function FiscalFields({ value, onChange }: Props) {
   const set =
      (key: keyof DatosFiscales) =>
      (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
         onChange({ ...value, [key]: e.target.value })

   return (
      <div className="grid gap-3 sm:grid-cols-2">
         <label className="flex flex-col gap-1 text-xs font-bold">
            RFC
            <input className={field} value={value.rfc} maxLength={13} onChange={(e) => onChange({ ...value, rfc: e.target.value.toUpperCase() })} />
         </label>
         <label className="flex flex-col gap-1 text-xs font-bold">
            Código postal fiscal
            <input className={field} value={value.codigoPostal} maxLength={5} inputMode="numeric" onChange={set('codigoPostal')} />
         </label>
         <label className="flex flex-col gap-1 text-xs font-bold sm:col-span-2">
            Razón social (tal como aparece en tu constancia fiscal)
            <input className={field} value={value.razonSocial} onChange={set('razonSocial')} />
         </label>
         <label className="flex flex-col gap-1 text-xs font-bold">
            Régimen fiscal
            <select className={field} value={value.regimenFiscal} onChange={set('regimenFiscal')}>
               {REGIMENES.map((r) => (
                  <option key={r.id} value={r.id}>{r.label}</option>
               ))}
            </select>
         </label>
         <label className="flex flex-col gap-1 text-xs font-bold">
            Uso de CFDI
            <select className={field} value={value.usoCfdi} onChange={set('usoCfdi')}>
               {USOS_CFDI.map((u) => (
                  <option key={u.id} value={u.id}>{u.label}</option>
               ))}
            </select>
         </label>
      </div>
   )
}