import type { APIRoute } from 'astro'
import { getCategories, listProducts } from '@/infrastructure/container'
import { pathFor } from '@/i18n/routes'
import { resizeImage } from '@/presentation/components/lib/image'

// Tope de productos que se guardan para uso sin conexión
const MAX_PRODUCTS = 80

export const GET: APIRoute = async () => {
   const pages = ['/', '/carrito', '/citas', '/login', '/registro']
   const images: string[] = []

   try {
      const [categories, products] = await Promise.all([getCategories.execute(), listProducts.execute()])

      for (const c of categories) pages.push(`/categoria/${c.id}`)

      for (const p of products.slice(0, MAX_PRODUCTS)) {
         pages.push(`/producto/${p.id}`)
         // Mismos tamaños que usan la tarjeta (520) y el detalle (900)
         if (p.img) images.push(resizeImage(p.img, 520), resizeImage(p.img, 900))
      }
   } catch (err) {
      console.error('[offline-urls] No se pudo leer el catálogo', err)
   }

   // Cada página en español con su versión en inglés (si existe)
   const withEnglish = pages.flatMap((es) => {
      const en = pathFor(es, 'en')
      return en ? [es, en] : [es]
   })

   return new Response(JSON.stringify({ pages: withEnglish, images }), {
      headers: {
         'Content-Type': 'application/json; charset=utf-8',
         'Cache-Control': 'no-store',
      },
   })
}