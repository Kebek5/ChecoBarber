import { drainOutbox, SYNC_TAG } from './pwa/outbox'

// ---------- Configuración ----------

// El plugin reemplaza `self.__WB_MANIFEST` por la lista de archivos del build.
// En desarrollo no es un arreglo, por eso se valida.
const RAW_MANIFEST = self.__WB_MANIFEST
const MANIFEST = Array.isArray(RAW_MANIFEST) ? RAW_MANIFEST : []

function hash(text) {
   let h = 0
   for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0
   return (h >>> 0).toString(36)
}

// El nombre del precaché cambia en cada build; las demás cachés conservan su nombre
const BUILD = hash(MANIFEST.map((e) => e.url + (e.revision ?? '')).join('|'))
const PRECACHE = `precache-${BUILD}`
const ASSETS = 'estaticos-v1'
const PAGES = 'paginas-catalogo-v1'
const IMAGES = 'imagenes-productos-v1'
const META = 'meta-v1'
const KEEP = [PRECACHE, ASSETS, PAGES, IMAGES, META]

const OFFLINE_URL = '/offline.html'
const ICON = '/icons/icon-192.webp'

const MAX_PAGES = 400
const MAX_IMAGES = 400
const CATALOG_TTL = 6 * 60 * 60 * 1000 // el catálogo se vuelve a guardar cada 6 horas
const CATALOG_KEY = '/__catalog-precache'

// Páginas públicas (sin prefijo de idioma; /en/... se trata igual)
const PUBLIC_PAGES = ['/', '/carrito', '/citas', '/login', '/registro']
const PUBLIC_PREFIXES = ['/categoria/', '/producto/']
const stripLocale = (path) => path.replace(/^\/en(?=\/|$)/, '') || '/'
const withEnglish = (path) => (path === '/' ? '/en' : `/en${path}`)
const SHELL_PAGES = PUBLIC_PAGES.flatMap((p) => [p, withEnglish(p)])

// Nunca se cachean: sesión, pagos, pedidos, panel y peticiones al backend
const NEVER_CACHE = [
   '/api/', '/webhooks', '/pago', '/checkout', '/dashboard', '/mis-compras',
   '/pedido/', '/datos-fiscales', '/salir', '/sw.js', '/offline-urls.json',
]

const isPublicPage = (path) => PUBLIC_PAGES.includes(path) || PUBLIC_PREFIXES.some((p) => path.startsWith(p))

// Cubre navegaciones reales y las que hace ClientRouter de Astro con fetch
const isPage = (request) =>
   request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html')

const isStaticAsset = (path) =>
   path.startsWith('/_astro/') ||
   path.startsWith('/icons/') ||
   /^\/(logo[\w-]*\.(png|webp)|favicon\.(svg|ico))$/.test(path)

// ---------- Utilidades ----------

async function trimCache(cache, max) {
   const keys = await cache.keys()
   await Promise.all(keys.slice(0, Math.max(0, keys.length - max)).map((k) => cache.delete(k)))
}

async function runInBatches(items, size, task) {
   for (let i = 0; i < items.length; i += size) {
      await Promise.all(items.slice(i, i + size).map(task))
   }
}

// Guarda una página anónima: sin cookies (no se copia el nombre del usuario) y sin redirecciones
async function cachePage(cache, path) {
   const res = await fetch(path, { credentials: 'omit', redirect: 'manual' })
   if (res.ok) await cache.put(path, res)
}

// ---------- Ciclo de vida ----------

self.addEventListener('install', (event) => {
   event.waitUntil(
      (async () => {
         const base = self.registration.scope

         // CSS, JS e iconos (los inyecta el plugin en __WB_MANIFEST) + página offline
         const cache = await caches.open(PRECACHE)
         await cache.add(OFFLINE_URL)
         await Promise.allSettled(MANIFEST.map((e) => cache.add(new URL(e.url, base).href)))

         // HTML de las páginas públicas del shell
         const pages = await caches.open(PAGES)
         await Promise.allSettled(SHELL_PAGES.map((p) => cachePage(pages, p)))

         await self.skipWaiting() // el SW nuevo no espera a que se cierren las pestañas
      })()
   )
})

self.addEventListener('activate', (event) => {
   event.waitUntil(
      (async () => {
         const keys = await caches.keys()
         await Promise.all(keys.filter((k) => !KEEP.includes(k)).map((k) => caches.delete(k)))
         console.info('[SW] activado. Caché de esta versión:', PRECACHE)
         await self.clients.claim() // toma el control de las pestañas ya abiertas
      })()
   )
})

// ---------- Precache del catálogo completo ----------

async function shouldPrecacheCatalog() {
   const meta = await caches.open(META)
   const hit = await meta.match(CATALOG_KEY)
   if (!hit) return true
   const [build, time] = (await hit.text()).split('|')
   return build !== BUILD || Date.now() - Number(time) > CATALOG_TTL
}

// Descarga todas las categorías, productos y fotos para poder abrirlos sin conexión
async function precacheCatalog(force = false) {
   if (!force && !(await shouldPrecacheCatalog())) return

   const res = await fetch('/offline-urls.json', { cache: 'no-store' })
   if (!res.ok) return
   const { pages = [], images = [] } = await res.json()

   const pagesCache = await caches.open(PAGES)
   await runInBatches(pages, 4, async (path) => {
      try {
         await cachePage(pagesCache, path)
      } catch {
         // una página que falla no detiene las demás
      }
   })
   await trimCache(pagesCache, MAX_PAGES)

   const imagesCache = await caches.open(IMAGES)
   await runInBatches(images, 6, async (url) => {
      try {
         if (await imagesCache.match(url)) return
         const img = await fetch(url, { mode: 'cors', credentials: 'omit' })
         if (img.ok) await imagesCache.put(url, img)
      } catch {
         // sin esa foto, la tarjeta muestra su marcador "Sin imagen"
      }
   })
   await trimCache(imagesCache, MAX_IMAGES)

   const meta = await caches.open(META)
   await meta.put(CATALOG_KEY, new Response(`${BUILD}|${Date.now()}`))
   console.info('[SW] catálogo guardado para uso sin conexión:', pages.length, 'páginas,', images.length, 'fotos')
}

// ---------- Estrategias de caché ----------

async function offlinePage() {
   return (
      (await caches.match(OFFLINE_URL)) ||
      new Response('Sin conexión', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
   )
}

// Cache-first: estáticos que casi no cambian
async function cacheFirst(request) {
   const cached = await caches.match(request)
   if (cached) return cached
   const res = await fetch(request)
   if (res.ok) await (await caches.open(ASSETS)).put(request, res.clone())
   return res
}

// Network-first: páginas con datos que cambian (stock, precio). Sin red, la última copia.
async function networkFirst(request, cacheName, timeoutMs) {
   const cache = await caches.open(cacheName)
   const network = fetch(request).then((res) => {
      if (res.ok && !res.redirected) {
         cache
            .put(request, res.clone())
            .then(() => trimCache(cache, MAX_PAGES))
            .catch(() => {})
      }
      return res
   })

   const exact = await cache.match(request, { ignoreVary: true })

   if (!exact) {
      // Sin copia exacta: red; si falla, la copia de la misma página sin query string (?q=, ?next=)
      return network.catch(
         async () => (await cache.match(request, { ignoreVary: true, ignoreSearch: true })) || offlinePage()
      )
   }

   // Si la red tarda demasiado, se muestra la copia mientras la red termina
   return Promise.race([
      network,
      new Promise((resolve) => setTimeout(() => resolve(exact), timeoutMs)),
   ]).catch(() => exact)
}

// Stale-while-revalidate: se ve al instante lo guardado y se actualiza en silencio
async function staleWhileRevalidate(event, cacheName, maxEntries) {
   const url = event.request.url
   const cache = await caches.open(cacheName)
   const cached = await cache.match(url)

   // Petición CORS propia para guardar la respuesta con su tamaño real (no "opaca")
   const update = fetch(url, { mode: 'cors', credentials: 'omit' }).then(async (res) => {
      if (res.ok) {
         await cache.put(url, res.clone())
         await trimCache(cache, maxEntries)
      }
      return res
   })

   if (cached) {
      event.waitUntil(update.catch(() => {}))
      return cached
   }
   return update.catch(() => fetch(event.request))
}

self.addEventListener('fetch', (event) => {
   const { request } = event
   if (request.method !== 'GET') return

   const url = new URL(request.url)

   // Fotos de producto
   if (url.hostname === 'res.cloudinary.com') {
      event.respondWith(staleWhileRevalidate(event, IMAGES, MAX_IMAGES))
      return
   }

   // Mercado Pago, PayPal, backend, etc.: no se tocan
   if (url.origin !== self.location.origin) return

   const path = stripLocale(url.pathname)
   const page = isPage(request)

   if (NEVER_CACHE.some((p) => path.startsWith(p))) {
      if (page) event.respondWith(fetch(request).catch(offlinePage))
      return
   }

   if (page) {
      event.respondWith(
         isPublicPage(path) ? networkFirst(request, PAGES, 3000) : fetch(request).catch(offlinePage)
      )
      return
   }

   if (isStaticAsset(path)) event.respondWith(cacheFirst(request))
})

// ---------- Notificaciones ----------

// Para cuando el backend envíe Web Push: { title, body, url, tag }
self.addEventListener('push', (event) => {
   let data = {}
   try {
      data = event.data ? event.data.json() : {}
   } catch {
      data = { body: event.data ? event.data.text() : '' }
   }
   event.waitUntil(
      self.registration.showNotification(data.title || 'ChecoBarber', {
         body: data.body || '',
         icon: ICON,
         badge: ICON,
         tag: data.tag,
         data: { url: data.url || '/' },
      })
   )
})

self.addEventListener('notificationclick', (event) => {
   event.notification.close()
   const target = new URL(event.notification.data?.url || '/', self.location.origin).href

   event.waitUntil(
      (async () => {
         const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
         const open = windows.find((w) => w.url === target)
         if (open) return open.focus()
         return self.clients.openWindow(target)
      })()
   )
})

// ---------- Sincronización en segundo plano ----------

let flushing = null

// Evita que el evento sync y el mensaje de la página manden dos veces lo mismo
function flushOutbox() {
   flushing ??= runFlush().finally(() => {
      flushing = null
   })
   return flushing
}

async function runFlush() {
   const { sent, rejected, retry } = await drainOutbox()

   if (sent > 0 || rejected > 0) {
      try {
         await self.registration.showNotification(
            sent > 0 ? 'Datos sincronizados' : 'No se pudo sincronizar',
            {
               body:
                  sent > 0
                     ? 'Lo que guardaste sin conexión ya llegó al servidor.'
                     : 'Revisa tus datos e inténtalo de nuevo.',
               icon: ICON,
               tag: 'sync-outbox',
               data: { url: '/' },
            }
         )
      } catch {
         // sin permiso de notificaciones: se ignora
      }
   }

   // Lanzar error le dice al navegador que vuelva a intentarlo más tarde
   if (retry) throw new Error('Reintentar la sincronización más tarde')
}

self.addEventListener('sync', (event) => {
   if (event.tag === SYNC_TAG) event.waitUntil(flushOutbox())
})

// ---------- Mensajes desde la página ----------

let precaching = null

self.addEventListener('message', (event) => {
   const type = event.data?.type

   if (type === 'FLUSH_OUTBOX') event.waitUntil(flushOutbox().catch(() => {}))
   if (type === 'SKIP_WAITING') self.skipWaiting()

   if (type === 'PRECACHE_CATALOG') {
      // Una sola descarga a la vez
      precaching ??= precacheCatalog(Boolean(event.data.force))
         .catch((err) => console.warn('[SW] no se pudo guardar el catálogo', err))
         .finally(() => {
            precaching = null
         })
      event.waitUntil(precaching)
   }
})