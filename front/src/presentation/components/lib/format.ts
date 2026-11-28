import type { Lang } from '@/i18n/ui'

const LOCALES: Record<Lang, string> = { es: 'es-MX', en: 'en-US' }

// En inglés la moneda se muestra como "MX$1,020.00" para distinguir los pesos de los dólares
const priceFormatters: Record<Lang, Intl.NumberFormat> = {
   es: new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }),
   en: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'MXN' }),
}

export const formatPrice = (value: number, lang: Lang = 'es') => priceFormatters[lang].format(value)

// Acepta "2026-10-22" o un ISO completo
export const formatDate = (iso: string, lang: Lang = 'es') => {
   const date = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T00:00:00`) : new Date(iso)
   return Number.isNaN(date.getTime()) ? iso : date.toLocaleDateString(LOCALES[lang], { dateStyle: 'medium' })
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