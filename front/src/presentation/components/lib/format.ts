const priceFormatter = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })

export const formatPrice = (value: number) => priceFormatter.format(value)

// Acepta "2026-10-22" o un ISO completo
export const formatDate = (iso: string) => {
   const date = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T00:00:00`) : new Date(iso)
   return Number.isNaN(date.getTime()) ? iso : date.toLocaleDateString('es-MX', { dateStyle: 'medium' })
}

// Fecha de hoy (YYYY-MM-DD) en la zona horaria de la barbería. En el servidor (UTC) la fecha local
// ya es "mañana" desde las 18:00 de México, y eso rompía "hoy" en citas y en el dashboard.
const SHOP_TZ = 'America/Mexico_City'
const todayFormatter = new Intl.DateTimeFormat('en-CA', {
   timeZone: SHOP_TZ,
   year: 'numeric',
   month: '2-digit',
   day: '2-digit',
})
export const todayISO = () => todayFormatter.format(new Date())
