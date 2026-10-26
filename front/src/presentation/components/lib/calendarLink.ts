// Enlace "Agregar a Google Calendar" para el cliente (no requiere OAuth)
export function googleCalendarLink(opts: {
   title: string
   date: string // YYYY-MM-DD
   hour: string // HH:MM
   minutes: number
   location?: string
}) {
   const day = opts.date.replaceAll('-', '')
   const start = `${day}T${opts.hour.replace(':', '')}00`
   const total = Number(opts.hour.slice(0, 2)) * 60 + Number(opts.hour.slice(3, 5)) + opts.minutes
   const end = `${day}T${String(Math.floor(total / 60)).padStart(2, '0')}${String(total % 60).padStart(2, '0')}00`

   const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: opts.title,
      dates: `${start}/${end}`,
      ctz: 'America/Mexico_City',
      location: opts.location ?? '',
   })
   return `https://calendar.google.com/calendar/render?${params}`
}