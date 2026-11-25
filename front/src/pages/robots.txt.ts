import type { APIRoute } from 'astro'

const PRIVATE = [
   '/dashboard', '/carrito', '/checkout', '/pago', '/pedido/',
   '/login', '/registro', '/mis-compras', '/datos-fiscales',
]

export const GET: APIRoute = ({ site, url }) => {
   const base = site ?? new URL(url.origin)
   const rules = [...PRIVATE, ...PRIVATE.map((p) => `/en${p}`)]

   const body = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /offline-urls.json
${rules.map((p) => `Disallow: ${p}`).join('\n')}

Sitemap: ${new URL('/sitemap.xml', base).href}
`

   return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}