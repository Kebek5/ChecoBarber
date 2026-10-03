// components/react/AddToCart.tsx
import { toast } from 'sonner'
import { Button } from '@/presentation/components/ui/button'
import { clientContainer } from '@/infrastructure/container.client'
import { StockLimitError } from '@/domain/cart'
import { isInStock, type Product } from '@/domain/catalog'

export default function AddToCart({ product, quantity = 1 }: { product: Product; quantity?: number }) {
   function handleClick() {
      try {
         clientContainer.addItemToCart.execute(product, quantity)
         toast.success(`${product.name} agregado al carrito`)
      } catch (error) {
         if (error instanceof StockLimitError) toast.error(error.message)
         else throw error
      }
   }

   return <Button onClick={handleClick} disabled={!isInStock(product)}>Agregar al carrito</Button>
}