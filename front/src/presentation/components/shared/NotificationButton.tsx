import { useEffect, useState } from 'react'
import { showLocalNotification } from '@/pwa/client'
import { Button } from '@/presentation/components/ui/button'

type Permiso = NotificationPermission | 'unsupported'

export default function NotificationButton() {
   // Se lee en el efecto (no en el render) para no romper la hidratación del SSR
   const [permiso, setPermiso] = useState<Permiso>('default')

   useEffect(() => {
      setPermiso('Notification' in window ? Notification.permission : 'unsupported')
   }, [])

   async function pedir() {
      const estado = await Notification.requestPermission()
      setPermiso(estado)
      if (estado === 'granted') {
         await showLocalNotification('Notificaciones activadas', {
            body: 'Te avisaremos de las novedades de ChecoBarber.',
            tag: 'bienvenida',
         })
      }
   }

   if (permiso === 'unsupported') return null

   if (permiso === 'granted') {
      return <p className="text-xs text-muted-foreground" role="status">Notificaciones activadas.</p>
   }

   if (permiso === 'denied') {
      return (
         <p className="text-xs text-muted-foreground">
            Bloqueaste las notificaciones. Actívalas desde la configuración del sitio en tu navegador.
         </p>
      )
   }

   return (
      <Button variant="outline" size="sm" onClick={pedir}>
         Activar notificaciones
      </Button>
   )
}