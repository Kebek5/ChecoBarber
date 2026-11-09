import type { APIRoute } from 'astro'

export const GET: APIRoute = ({ site, url }) => {
   const base = site ?? new URL(url.origin)

   const body = `User-agent: *
Allow: /
Disallow: /dashboard
Disallow: /api/
Disallow: /carrito
Disallow: /checkout
Disallow: /pago
Disallow: /pedido/
Disallow: /login
Disallow: /registro
Disallow: /mis-compras
Disallow: /datos-fiscales

Sitemap: ${new URL('/sitemap.xml', base).href}
`

   return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}