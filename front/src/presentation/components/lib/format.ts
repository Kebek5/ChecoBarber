const priceFormatter = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })

export const formatPrice = (value: number) => priceFormatter.format(value)

// Acepta "2026-10-22" o un ISO completo
export const formatDate = (iso: string) => {
   const date = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T00:00:00`) : new Date(iso)
   return Number.isNaN(date.getTime()) ? iso : date.toLocaleDateString('es-MX', { dateStyle: 'medium' })
}

// Fecha local de hoy en formato YYYY-MM-DD
export const todayISO = () => {
   const now = new Date()
   const month = String(now.getMonth() + 1).padStart(2, '0')
   const day = String(now.getDate()).padStart(2, '0')
   return `${now.getFullYear()}-${month}-${day}`
}