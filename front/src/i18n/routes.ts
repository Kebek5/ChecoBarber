import type { Lang } from './ui'

// Segmentos que cambian de idioma. Solo las rutas listadas aquí existen también en inglés.
const SEGMENTS: Record<string, string> = {
   categoria: 'category',
   producto: 'product',
   carrito: 'cart',
}

const REVERSE: Record<string, string> = Object.fromEntries(
   Object.entries(SEGMENTS).map(([es, en]) => [en, es])
)

/** /en/product/1 → /producto/1 · /en → / · cualquier otra ruta se devuelve igual */
export function toSpanishPath(pathname: string): string {
   if (pathname !== '/en' && !pathname.startsWith('/en/')) return pathname
   const [, , first, ...tail] = pathname.split('/')
   if (!first) return '/'
   return '/' + [REVERSE[first] ?? first, ...tail].join('/')
}

/** ¿La ruta (en español) también existe en inglés? */
export function hasEnglishVersion(esPath: string): boolean {
   if (esPath === '/') return true
   return Object.hasOwn(SEGMENTS, esPath.split('/')[1] ?? '')
}

/** Ruta equivalente en otro idioma; null si esa versión no existe */
export function pathFor(pathname: string, lang: Lang): string | null {
   const es = toSpanishPath(pathname)
   if (lang === 'es') return es
   if (!hasEnglishVersion(es)) return null
   if (es === '/') return '/en'
   const [, first, ...tail] = es.split('/')
   return '/' + ['en', SEGMENTS[first], ...tail].join('/')
}

/** Enlace interno según el idioma actual: /carrito → /en/cart (solo si existe versión en inglés) */
export function localizeHref(href: string, lang: Lang): string {
   if (lang === 'es' || !href.startsWith('/')) return href
   const [, path, suffix] = href.match(/^([^?#]*)(.*)$/) as RegExpMatchArray
   return (pathFor(path, 'en') ?? path) + suffix
}

/** Versiones alternas para hreflang (vacío si la página solo existe en español) */
export function alternates(pathname: string): { lang: Lang; path: string }[] {
   const en = pathFor(pathname, 'en')
   if (!en) return []
   return [
      { lang: 'es', path: pathFor(pathname, 'es') as string },
      { lang: 'en', path: en },
   ]
}

/** A dónde lleva el selector de idioma desde la página actual */
export function switchPath(pathname: string, target: Lang): string {
   return pathFor(pathname, target) ?? (target === 'en' ? '/en' : '/')
}