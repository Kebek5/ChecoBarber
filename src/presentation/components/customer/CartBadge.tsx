import { ShoppingCartIcon } from '@phosphor-icons/react'
import { useCartStore } from '@/infrastructure/cart/zustandCartStore'
import { Badge } from '@/presentation/components/ui/badge'
import { buttonVariants } from '@/presentation/components/ui/button'

export default function CartBadge() {
  const totalItems = useCartStore((state) => state.getTotalItems())

  return (
    <a href="/carrito" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
      <ShoppingCartIcon weight="bold" />
      <span className="hidden sm:inline">Tu carrito</span>
      <Badge variant="secondary" className="ml-1 rounded-full px-1.5">
        {totalItems}
      </Badge>
    </a>
  )
}