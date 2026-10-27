// Utilidades compartidas por las gráficas SVG del panel (se renderizan en el servidor, sin JS)

export const SERIES_COLORS = ['var(--viz-1)', 'var(--viz-2)', 'var(--viz-3)', 'var(--viz-4)', 'var(--viz-5)'] as const
export const OTHER_COLOR = 'var(--muted-foreground)'

const moneyFull = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })

export const fmtValue = (value: number, money = false) =>
   money ? moneyFull.format(value) : new Intl.NumberFormat('es-MX').format(value)

// Compacto para ejes: 0 / 1 k / 2.5 k
export function fmtAxis(value: number, money = false): string {
   const abs = Math.abs(value)
   const body =
      abs >= 1_000_000
         ? `${+(value / 1_000_000).toFixed(1)} M`
         : abs >= 1_000
           ? `${+(value / 1_000).toFixed(1)} k`
           : `${+value.toFixed(abs < 10 ? 1 : 0)}`
   return money ? `$${body}` : body
}

// Máximo "redondo" para que las marcas del eje queden en números limpios
export function niceMax(value: number): number {
   if (value <= 0) return 1
   const exp = 10 ** Math.floor(Math.log10(value))
   const f = value / exp
   const nf = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10
   return nf * exp
}

export const shortDate = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
export const monthLabel = (ym: string) => MONTHS[Number(ym.slice(5, 7)) - 1] ?? ym

export interface Series {
   name: string
   color: string
   values: number[]
}
