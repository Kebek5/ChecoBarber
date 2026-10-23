import { ShoppingCartIcon } from '@phosphor-icons/react/dist/csr/ShoppingCart'
import type { CartProduct } from '@/domain/cart/Cart'
import { addItemToCart } from '@/infrastructure/cart/zustandCartStore'
import { Button } from '@/presentation/components/ui/button'

interface AddToCartButtonProps {
  product: CartProduct
  disabled?: boolean
  label?: string
  variant?: 'default' | 'outline'
  size?: 'default' | 'sm' | 'lg'
  className?: string
}

export default function AddToCartButton({
  product,
  disabled = false,
  label = 'Añadir',
  variant = 'outline',
  size = 'default',
  className,
}: AddToCartButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      disabled={disabled}
      onClick={() => addItemToCart.execute(product)}
    >
      <ShoppingCartIcon weight="bold" />
      {label}
    </Button>
  )
}