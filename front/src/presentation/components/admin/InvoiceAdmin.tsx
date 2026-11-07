import { useCallback, useEffect, useMemo, useState } from 'react'
import { EMPTY_FISCAL, type DatosFiscales } from '@/domain/order/Fiscal'
import { paymentsApi } from '@/infrastructure/payments/paymentsApi'
import { Button } from '@/presentation/components/ui/button'
import FiscalFields from '@/presentation/components/shared/FiscalFields'

interface Row {
   referencia: string
   fecha: string
   total: number
   metodoPago: string
   cliente: string
   correo: string
   rfc: string | null
   facturaEstado: 'generando' | 'generada' | 'enviada' | 'error' | null
   facturaError: string | null
   enviadaEn: string | null
   correoDestino: string | null
}

type Mode = 'saved' | 'general' | 'custom'

const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })

const ESTADO_LABEL: Record<string, string> = {
   generando: 'Generando…',
   generada: 'Generada (sin enviar)',
   enviada: 'Enviada',
   error: 'Error',
}

const field = 'w-full border px-2 py-1.5 text-xs'

export default function InvoiceAdmin() {
   const [rows, setRows] = useState<Row[]>([])
   const [loading, setLoading] = useState(true)
   const [error, setError] = useState('')
   const [success, setSuccess] = useState('')
   const [search, setSearch] = useState('')

   const [openRef, setOpenRef] = useState<string | null>(null)
   const [mode, setMode] = useState<Mode>('general')
   const [correo, setCorreo] = useState('')
   const [fiscal, setFiscal] = useState<DatosFiscales>(EMPTY_FISCAL)
   const [busy, setBusy] = useState(false)

   const load = useCallback(async () => {
      try {
         setRows(await paymentsApi.get<Row[]>('admin/facturas'))
         setError('')
      } catch (err) {
         setError(err instanceof Error ? err.message : 'No se pudieron cargar los pedidos.')
      } finally {
         setLoading(false)
      }
   }, [])

   useEffect(() => {
      load()
   }, [load])

   const visible = useMemo(() => {
      const q = search.trim().toLowerCase()
      if (!q) return rows
      return rows.filter((r) =>
         [r.referencia, r.cliente, r.correo, r.rfc ?? ''].some((v) => v.toLowerCase().includes(q))
      )
   }, [rows, search])

   function openForm(row: Row) {
      setOpenRef(row.referencia)
      setMode(row.rfc ? 'saved' : 'general')
      setCorreo(row.correoDestino ?? row.correo)
      setFiscal(EMPTY_FISCAL)
      setSuccess('')
      setError('')
   }

   async function submit(row: Row) {
      setBusy(true)
      setError('')
      setSuccess('')
      try {
         await paymentsApi.post(`admin/factura/${row.referencia}`, {
            correo: correo.trim(),
            publicoGeneral: mode === 'general',
            receptor: mode === 'custom' ? fiscal : undefined,
         })
         setSuccess(`Factura del pedido ${row.referencia} enviada a ${correo.trim() || row.correo}.`)
         setOpenRef(null)
         await load()
      } catch (err) {
         setError(err instanceof Error ? err.message : 'No se pudo facturar.')
         await load()
      } finally {
         setBusy(false)
      }
   }

   return (
      <div className="flex flex-col gap-4">
         <input
            className="w-full max-w-sm border px-2 py-1.5 text-xs"
            placeholder="Buscar por pedido, cliente, correo o RFC"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
         />

         {error && (
            <div className="border border-destructive/40 bg-destructive/10 p-2.5 text-xs text-destructive" role="alert">
               <strong>Error:</strong> {error}
            </div>
         )}
         {success && (
            <div className="border border-green-600/40 bg-green-600/10 p-2.5 text-xs text-green-700" role="status">
               {success}
            </div>
         )}

         {loading ? (
            <p className="text-xs text-muted-foreground">Cargando…</p>
         ) : visible.length === 0 ? (
            <p className="text-xs text-muted-foreground">No hay pedidos pagados en esta vista.</p>
         ) : (
            <div className="overflow-x-auto">
               <table className="w-full text-left text-xs">
                  <thead>
                     <tr className="border-b">
                        <th className="p-2">Pedido</th>
                        <th className="p-2">Fecha</th>
                        <th className="p-2">Cliente</th>
                        <th className="p-2">RFC</th>
                        <th className="p-2">Total</th>
                        <th className="p-2">Factura</th>
                        <th className="p-2">Acciones</th>
                     </tr>
                  </thead>
                  <tbody>
                     {visible.map((row) => (
                        <>
                           <tr key={row.referencia} className="border-b align-top">
                              <td className="p-2 font-bold">{row.referencia}</td>
                              <td className="p-2">{row.fecha}</td>
                              <td className="p-2">
                                 <div className="font-bold">{row.cliente}</div>
                                 <div className="text-muted-foreground">{row.correo}</div>
                              </td>
                              <td className="p-2">{row.rfc ?? '—'}</td>
                              <td className="p-2">{money.format(row.total)}</td>
                              <td className="p-2">
                                 {row.facturaEstado ? ESTADO_LABEL[row.facturaEstado] : 'Sin facturar'}
                                 {row.facturaEstado === 'error' && row.facturaError && (
                                    <div className="max-w-60 text-destructive">{row.facturaError}</div>
                                 )}
                                 {row.facturaEstado === 'enviada' && row.correoDestino && (
                                    <div className="text-muted-foreground">a {row.correoDestino}</div>
                                 )}
                              </td>
                              <td className="p-2">
                                 <div className="flex flex-wrap gap-2">
                                    <Button size="sm" variant="outline" onClick={() => (openRef === row.referencia ? setOpenRef(null) : openForm(row))}>
                                       {row.facturaEstado ? 'Re-facturar' : 'Facturar'}
                                    </Button>
                                    {(row.facturaEstado === 'generada' || row.facturaEstado === 'enviada') && (
                                       <a
                                          className="inline-flex items-center border px-2.5 text-xs hover:bg-muted"
                                          href={`/api/pagos/factura/${row.referencia}`}
                                          download={`factura-${row.referencia}.xml`}
                                       >
                                          Descargar XML
                                       </a>
                                    )}
                                 </div>
                              </td>
                           </tr>

                           {openRef === row.referencia && (
                              <tr key={`${row.referencia}-form`} className="border-b bg-muted/40">
                                 <td colSpan={7} className="p-4">
                                    <div className="flex max-w-2xl flex-col gap-3">
                                       <label className="flex flex-col gap-1 text-xs font-bold">
                                          Enviar a este correo
                                          <input className={field} type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} />
                                       </label>

                                       <label className="flex flex-col gap-1 text-xs font-bold">
                                          Facturar a
                                          <select className={field} value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
                                             {row.rfc && <option value="saved">Datos fiscales guardados del cliente ({row.rfc})</option>}
                                             <option value="general">Público en general</option>
                                             <option value="custom">Capturar datos fiscales ahora</option>
                                          </select>
                                       </label>

                                       {mode === 'custom' && <FiscalFields value={fiscal} onChange={setFiscal} />}

                                       <div className="flex gap-2">
                                          <Button size="sm" disabled={busy} onClick={() => submit(row)}>
                                             {busy ? 'Enviando…' : 'Generar y enviar factura'}
                                          </Button>
                                          <Button size="sm" variant="outline" disabled={busy} onClick={() => setOpenRef(null)}>
                                             Cancelar
                                          </Button>
                                       </div>
                                    </div>
                                 </td>
                              </tr>
                           )}
                        </>
                     ))}
                  </tbody>
               </table>
            </div>
         )}
      </div>
   )
}