import { SYNC_TAG, enqueue } from './outbox'

const ICON = '/icons/icon-192.webp'

type SyncRegistration = ServiceWorkerRegistration & {
   sync?: { register(tag: string): Promise<void> }
}

// `serviceWorker.ready` nunca resuelve si no hay SW registrado (por ejemplo en desarrollo),
// por eso se limita la espera.
async function getRegistration(timeoutMs = 1500): Promise<SyncRegistration | undefined> {
   if (!('serviceWorker' in navigator)) return undefined
   return Promise.race([
      navigator.serviceWorker.ready as Promise<SyncRegistration>,
      new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), timeoutMs)),
   ])
}

/** ¿El error se debe a falta de conexión? (paymentsApi lanza status 0 si el fetch falla) */
export function isOfflineError(err: unknown): boolean {
   return (
      !navigator.onLine || err instanceof TypeError ||
      (err as { status?: number } | null)?.status === 0
   )
}

/** Guarda una petición para enviarla cuando vuelva la red (Background Sync). */
export async function queueRequest(url: string, method: 'POST' | 'PUT', payload: unknown): Promise<void> {
   await enqueue({ url, method, body: JSON.stringify(payload) })
   const reg = await getRegistration()
   await reg?.sync?.register(SYNC_TAG).catch(() => {})
}

async function flushQueue(): Promise<void> {
   const reg = await getRegistration()
   reg?.active?.postMessage({ type: 'FLUSH_OUTBOX' })
}

/** Pide al SW guardar todas las categorías y productos para verlos sin conexión. */
async function precacheCatalog(): Promise<void> {
   // En la primera visita el SW tarda en activarse: se espera más
   const reg = await getRegistration(15000)
   reg?.active?.postMessage({ type: 'PRECACHE_CATALOG' })
}

/** Notificación del sistema mostrada por el Service Worker (si hay permiso). */
export async function showLocalNotification(
   title: string,
   options: NotificationOptions & { url?: string } = {}
): Promise<boolean> {
   if (!('Notification' in window) || Notification.permission !== 'granted') return false
   const reg = await getRegistration()
   if (!reg) return false
   const { url, ...rest } = options
   await reg.showNotification(title, { icon: ICON, badge: ICON, data: { url: url ?? '/' }, ...rest })
   return true
}

/**
   Safari y Firefox no tienen Background Sync: al volver la red (o al abrir la página)
   se le pide al SW que vacíe la cola.
*/
export function initPwaClient(): void {
   if (!('serviceWorker' in navigator)) return

   window.addEventListener('online', () => {
      flushQueue()
      precacheCatalog()
   })

   if (navigator.onLine) {
      flushQueue()
      // Cuando el navegador está libre, para no competir con la carga de la página
      if ('requestIdleCallback' in window) {
         window.requestIdleCallback(() => precacheCatalog(), { timeout: 8000 })
      } else {
         setTimeout(precacheCatalog, 4000)
      }
   }
}