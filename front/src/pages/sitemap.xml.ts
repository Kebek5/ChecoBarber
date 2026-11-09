import type { APIRoute } from 'astro'
import { getCategories, listProducts } from '@/infrastructure/container'

export const GET: APIRoute = async ({ site, url }) => {
   const base = site ?? new URL(url.origin)
   const paths = ['/', '/citas']

   try {
      const [categories, products] = await Promise.all([getCategories.execute(), listProducts.execute()])
      for (const c of categories) paths.push(`/categoria/${c.id}`)
      for (const p of products) paths.push(`/producto/${p.id}`)
   } catch (err) {
      console.error('[sitemap] No se pudo leer el catálogo', err)
   }

   const urls = paths.map((p) => `  <url><loc>${new URL(p, base).href}</loc></url>`).join('\n')
   const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`

   return new Response(xml, {
      headers: {
         'Content-Type': 'application/xml; charset=utf-8',
         'Cache-Control': 'public, s-maxage=3600',
      },
   })
}