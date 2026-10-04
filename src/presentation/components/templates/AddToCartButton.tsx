import type { CartProduct } from '@/domain/cart/Cart'
import { addItemToCart } from '@/infrastructure/cart/zustandCartStore'
import { Button } from '@/presentation/components/ui/button'

interface AddToCartButtonProps {
  product: CartProduct
  disabled?: boolean
  label?: string
}

export default function AddToCartButton({
  product,
  disabled = false,
  label = 'Añadir al carrito',
}: AddToCartButtonProps) {
  return (
    <Button size="lg" disabled={disabled} onClick={() => addItemToCart.execute(product)}>
      {label}
    </Button>
  )
}