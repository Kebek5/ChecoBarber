import { ShoppingCartIcon } from '@phosphor-icons/react/dist/csr/ShoppingCart'
import { useCartStore } from '@/infrastructure/cart/zustandCartStore'
import { localizeHref } from '@/i18n/routes'
import { t, type Lang } from '@/i18n/ui'
import { Badge } from '@/presentation/components/ui/badge'
import { buttonVariants } from '@/presentation/components/ui/button'

export default function CartBadge({ lang = 'es' }: { lang?: Lang }) {
  const totalItems = useCartStore((state) => state.getTotalItems())

  return (
    <a href={localizeHref('/carrito', lang)} className={buttonVariants({ variant: 'outline', size: 'lg' })}>
      <ShoppingCartIcon weight="bold" aria-hidden="true" />
      <span className="hidden sm:inline">{t(lang, 'navCart')}</span>
      <Badge variant="secondary" className="ml-1 rounded-full px-1.5" aria-hidden="true">
        {totalItems}
      </Badge>
      {/* Anuncia los cambios del contador a lectores de pantalla */}
      <span className="sr-only" role="status" aria-live="polite">
        {totalItems === 1 ? t(lang, 'cartItemsOne') : t(lang, 'cartItemsMany', { n: totalItems })}
      </span>
    </a>
  )
}