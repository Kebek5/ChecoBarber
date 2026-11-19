const DB_NAME = 'checobarber-outbox'
const STORE = 'requests'

export const SYNC_TAG = 'outbox-sync'

export interface QueuedRequest {
   id: number
   url: string
   method: string
   body: string | null
   createdAt: number
}

function openDb(): Promise<IDBDatabase> {
   return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1)
      req.onupgradeneeded = () => {
         req.result.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true })
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
   })
}

function promisify<T>(req: IDBRequest<T>): Promise<T> {
   return new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
   })
}

export async function enqueue(item: Pick<QueuedRequest, 'url' | 'method' | 'body'>): Promise<void> {
   const db = await openDb()
   await promisify(db.transaction(STORE, 'readwrite').objectStore(STORE).add({ ...item, createdAt: Date.now() }))
   db.close()
}

export async function listQueue(): Promise<QueuedRequest[]> {
   const db = await openDb()
   const items = (await promisify(db.transaction(STORE).objectStore(STORE).getAll())) as QueuedRequest[]
   db.close()
   return items
}

export async function removeFromQueue(id: number): Promise<void> {
   const db = await openDb()
   await promisify(db.transaction(STORE, 'readwrite').objectStore(STORE).delete(id))
   db.close()
}

/**
   Reenvía la cola en orden.
   - 2xx: enviada y se borra.
   - 4xx: el servidor la rechazó; reintentar no sirve, se borra y se cuenta como rechazada.
   - Sin red o 5xx: se conserva y se pide reintento (retry = true).
*/
export async function drainOutbox(send: typeof fetch = fetch) {
   let sent = 0
   let rejected = 0
   let retry = false

   for (const item of await listQueue()) {
      try {
         const res = await send(item.url, {
            method: item.method,
            headers: { 'Content-Type': 'application/json' },
            body: item.body,
            credentials: 'same-origin',
         })
         if (res.ok) {
            sent++
            await removeFromQueue(item.id)
         } else if (res.status >= 400 && res.status < 500) {
            rejected++
            await removeFromQueue(item.id)
         } else {
            retry = true
            break
         }
      } catch {
         retry = true
         break
      }
   }
   return { sent, rejected, retry }
}