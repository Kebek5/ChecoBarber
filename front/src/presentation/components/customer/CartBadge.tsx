import { ShoppingCartIcon } from '@phosphor-icons/react/dist/csr/ShoppingCart'
import { useCartStore } from '@/infrastructure/cart/zustandCartStore'
import { Badge } from '@/presentation/components/ui/badge'
import { buttonVariants } from '@/presentation/components/ui/button'

export default function CartBadge() {
  const totalItems = useCartStore((state) => state.getTotalItems())

  return (
    <a href="/carrito" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
      <ShoppingCartIcon weight="bold" aria-hidden="true" />
      <span className="hidden sm:inline">Tu carrito</span>
      <Badge variant="secondary" className="ml-1 rounded-full px-1.5" aria-hidden="true">
        {totalItems}
      </Badge>
      {/* Anuncia los cambios del contador a lectores de pantalla */}
      <span className="sr-only" role="status" aria-live="polite">
        {totalItems === 1 ? '1 artículo en tu carrito' : `${totalItems} artículos en tu carrito`}
      </span>
    </a>
  )
}