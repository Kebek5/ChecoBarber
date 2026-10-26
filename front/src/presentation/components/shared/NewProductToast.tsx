import { useEffect, useState } from 'react'
import { createClient } from 'graphql-ws'
import { formatPrice } from '@/presentation/components/lib/format'

interface NewProduct {
   id: string
   name: string
   price: number
   category: { name: string } | null
}

interface Props {
   wsUrl: string
   admin?: boolean // en el panel el enlace lleva a administrar el producto
}

const QUERY = `subscription { productCreated { id name price category { name } } }`
const VISIBLE_MS = 8000

export default function NewProductToast({ wsUrl, admin = false }: Props) {
   const [items, setItems] = useState<NewProduct[]>([])

   const dismiss = (id: string) => setItems((prev) => prev.filter((p) => p.id !== id))

   useEffect(() => {
      const client = createClient({ url: wsUrl, retryAttempts: Infinity })

      const dispose = client.subscribe<{ productCreated: NewProduct }>(
         { query: QUERY },
         {
            next: ({ data }) => {
               const product = data?.productCreated
               if (!product) return
               setItems((prev) => [product, ...prev.filter((p) => p.id !== product.id)].slice(0, 3))
               setTimeout(() => dismiss(product.id), VISIBLE_MS)
            },
            error: (err) => console.error('[suscripción productCreated]', err),
            complete: () => {},
         }
      )

      return () => {
         dispose()
         client.dispose()
      }
   }, [wsUrl])

   if (items.length === 0) return null

   return (
      <div className="fixed right-4 bottom-4 z-50 flex w-72 flex-col gap-2" aria-live="polite">
         {items.map((product) => (
            <div key={product.id} className="border bg-background p-3 text-xs shadow-md">
               <div className="flex items-start justify-between gap-2">
                  <span className="font-bold">Nuevo producto</span>
                  <button type="button" onClick={() => dismiss(product.id)} aria-label="Cerrar aviso" className="text-muted-foreground hover:text-foreground">
                     ✕
                  </button>
               </div>
               <p className="mt-1">{product.name}</p>
               <p className="text-muted-foreground">
                  {product.category?.name ?? 'Sin categoría'} · {formatPrice(product.price)}
               </p>
               <a
                  href={admin ? `/dashboard/productos/${product.id}` : `/producto/${product.id}`}
                  className="mt-2 inline-block font-bold underline"
               >
                  {admin ? 'Administrar' : 'Ver producto'}
               </a>
            </div>
         ))}
      </div>
   )
}