// ProductActions.tsx
import { useState } from 'react'
import { ShoppingCartIcon } from '@phosphor-icons/react'
import type { Product } from '@/domain/catalog/Product'
import { addItemToCart } from '@/infrastructure/cart/zustandCartStore'
import { Button } from '@/presentation/components/ui/button'
import { buttonVariants } from '@/presentation/components/ui/button'

interface ProductActionsProps {
      product: Product
}

export default function ProductActions({ product }: ProductActionsProps) {
   // Inicializamos el estado del stock localmente con el valor que viene del servidor
   const [currentStock, setCurrentStock] = useState(product.stock)
   const inStock = currentStock > 0

   const handleAddToCart = () => {
      if (!inStock) return

      // 1. Ejecuta la lógica existente para añadir al carrito de Zustand
      addItemToCart.execute({
         id: product.id,
         name: product.name,
         price: product.price,
         img: product.img
      })

      // 2. Disminuye el stock en el estado de la pantalla de forma inmediata
      setCurrentStock(prev => prev - 1)
   }

   return (
      <div className="flex flex-col items-start w-full">
         {/* Texto del stock reactivo */}
         <p className={`mb-6 text-[13px] ${inStock ? 'text-green-600' : 'text-destructive'}`}>
         {inStock ? `Stock disponible: ${currentStock} unidades` : 'Agotado'}
         </p>

      {/* Botones de acción */}
      <div className="flex flex-wrap gap-2.5">
         <Button
            variant="default"
            size="lg"
            className="min-w-50"
            disabled={!inStock}
            onClick={handleAddToCart}
         >
            <ShoppingCartIcon weight="bold" className="mr-2" />
            Añadir al carrito
         </Button>

         <a href="/carrito" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
            <ShoppingCartIcon /> Ir al carrito
         </a>
      </div>
      </div>
   )
}
