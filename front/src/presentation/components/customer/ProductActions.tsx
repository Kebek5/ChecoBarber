import { useState } from 'react'
import { ShoppingCartIcon } from '@phosphor-icons/react'
import type { Product } from '@/domain/catalog/Product'
import { addItemToCart } from '@/infrastructure/cart/zustandCartStore'
import { localizeHref } from '@/i18n/routes'
import { t, type Lang } from '@/i18n/ui'
import { Button, buttonVariants } from '@/presentation/components/ui/button'

interface ProductActionsProps {
   product: Product
   lang?: Lang
}

export default function ProductActions({ product, lang = 'es' }: ProductActionsProps) {
   // Estado del stock local, inicializado con el valor del servidor
   const [currentStock, setCurrentStock] = useState(product.stock)
   const inStock = currentStock > 0

   const handleAddToCart = () => {
      if (!inStock) return

      addItemToCart.execute({
         id: product.id,
         name: product.name,
         price: product.price,
         img: product.img
      })

      setCurrentStock((prev) => prev - 1)
   }

   return (
      <div className="flex w-full flex-col items-start">
         <p className={`mb-6 text-[13px] ${inStock ? 'text-green-800' : 'text-destructive'}`}>
            {inStock ? t(lang, 'stockAvailable', { n: currentStock }) : t(lang, 'soldOut')}
         </p>

         <div className="flex flex-wrap gap-2.5">
            <Button variant="default" size="lg" className="min-w-50" disabled={!inStock} onClick={handleAddToCart}>
               <ShoppingCartIcon weight="bold" className="mr-2" />
               {t(lang, 'addToCart')}
            </Button>

            <a href={localizeHref('/carrito', lang)} className={buttonVariants({ variant: 'outline', size: 'lg' })}>
               <ShoppingCartIcon /> {t(lang, 'goToCart')}
            </a>
         </div>
      </div>
   )
}