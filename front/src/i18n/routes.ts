import { getRelativeLocaleUrl } from 'astro:i18n'
import { stripLocale, type Lang } from './ui'

/** Misma ruta en otro idioma: pathFor('/en/producto/1', 'es') → /producto/1 */
export function pathFor(pathname: string, lang: Lang): string {
   return getRelativeLocaleUrl(lang, stripLocale(pathname))
}

/** Enlace interno según el idioma: localizeHref('/carrito', 'en') → /en/carrito (conserva ?query y #hash) */
export function localizeHref(href: string, lang: Lang): string {
   if (!href.startsWith('/')) return href
   const [, path, suffix] = href.match(/^([^?#]*)(.*)$/) as RegExpMatchArray
   return pathFor(path, lang) + suffix
}