import type { Product } from '@/domain/catalog/Product'

// Recorta a un máximo de caracteres (title ≤ 60, description ≤ 160)
export function truncate(text: string, max: number): string {
   const clean = text.replace(/\s+/g, ' ').trim()
   if (clean.length <= max) return clean
   return clean.slice(0, max - 1).trimEnd() + '…'
}

// Datos estructurados schema.org/Product
export function productJsonLd(product: Product, pageUrl: string, imageUrl?: string) {
   return {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      ...(imageUrl && { image: [imageUrl] }),
      description: truncate(product.description || product.name, 300),
      sku: product.id,
      ...(product.category && { category: product.category.name }),
      offers: {
         '@type': 'Offer',
         url: pageUrl,
         price: product.price.toFixed(2),
         priceCurrency: 'MXN',
         availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
         itemCondition: 'https://schema.org/NewCondition',
      },
   }
}

// JSON seguro para incrustar dentro de <script> (evita cerrar la etiqueta con "</script>")
export const toScriptJson = (data: unknown) => JSON.stringify(data).replace(/</g, '\\u003c')