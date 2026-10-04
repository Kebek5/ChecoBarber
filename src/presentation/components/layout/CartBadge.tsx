import { useCartStore } from '@/infrastructure/cart/zustandCartStore'

export default function CartBadge() {
  const totalItems = useCartStore((state) => state.getTotalItems())

  return (
    <a href="/carrito" className="hover:underline">
      🛒 Carrito ({totalItems})
    </a>
  )
}