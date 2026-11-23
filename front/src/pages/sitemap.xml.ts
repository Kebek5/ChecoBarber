import type { APIRoute } from 'astro'
import { getCategories, listProducts } from '@/infrastructure/container'
import { pathFor } from '@/i18n/routes'

export const GET: APIRoute = async ({ site, url }) => {
   const base = site ?? new URL(url.origin)
   const abs = (path: string) => new URL(path, base).href
   const paths = ['/', '/citas']

   try {
      const [categories, products] = await Promise.all([getCategories.execute(), listProducts.execute()])
      for (const c of categories) paths.push(`/categoria/${c.id}`)
      for (const p of products) paths.push(`/producto/${p.id}`)
   } catch (err) {
      console.error('[sitemap] No se pudo leer el catálogo', err)
   }

   const urls = paths.flatMap((es) => {
      const en = pathFor(es, 'en')
      const alternates = en
         ? `
    <xhtml:link rel="alternate" hreflang="es" href="${abs(es)}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${abs(en)}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${abs(es)}"/>`
         : ''
      const entry = (loc: string) => `  <url>
    <loc>${abs(loc)}</loc>${alternates}
  </url>`
      return en ? [entry(es), entry(en)] : [entry(es)]
   })

   const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`

   return new Response(xml, {
      headers: {
         'Content-Type': 'application/xml; charset=utf-8',
         'Cache-Control': 'public, s-maxage=3600',
      },
   })
}