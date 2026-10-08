import { useCartStore } from '@/infrastructure/cart/zustandCartStore'
import { Badge } from '@/presentation/components/ui/badge'
import { buttonVariants } from '@/presentation/components/ui/button'
import { Card } from '@/presentation/components/ui/card'
import { Separator } from '@/presentation/components/ui/separator'

// Resumen lateral del carrito (el "Context" del diseño anterior)
export default function MiniCart() {
   const items = useCartStore((state) => state.items)
   const totalPrice = useCartStore((state) => state.getTotalPrice())
   const totalItems = useCartStore((state) => state.getTotalItems())

   return (
      <Card className="sticky top-28 my-7.5 mr-7.5 w-70 min-w-70 gap-0 bg-muted/40 p-5 shadow-[0_0_20px_#2222]">
         <div className="flex items-center justify-between pb-4">
         <h2 className="text-xl font-bold tracking-wide">Tu carrito</h2>
         <Badge variant="outline" className="size-7 justify-center rounded-full p-0">
            {totalItems}
         </Badge>
         </div>
         <Separator />

         {items.length === 0 ? (
         <p className="px-1 py-8 text-center text-sm text-muted-foreground">
            Aún no has agregado productos.
         </p>
         ) : (
         <ul className="flex max-h-87.5 flex-col gap-3 overflow-y-auto py-4">
            {items.map((item) => (
               <li key={item.id} className="flex items-start justify-between gap-2.5 border-b pb-2.5 last:border-b-0">
               <div className="flex min-w-0 flex-col gap-1">
                  <h3 className="truncate text-sm font-medium">{item.name}</h3>
                  <span className="text-xs text-muted-foreground">
                     {item.quantity} × ${item.price.toFixed(2)}
                  </span>
               </div>
               <strong className="text-[13px] whitespace-nowrap">
                  ${(item.price * item.quantity).toFixed(2)}
               </strong>
               </li>
            ))}
         </ul>
         )}

         <Separator />
         <div className="flex items-center justify-between py-4">
         <span>Total</span>
         <strong className="text-lg">${totalPrice.toFixed(2)}</strong>
         </div>
         <a href="/carrito" className={buttonVariants({ variant: 'outline', size: 'lg', className: 'w-full' })}>
         Ver carrito
         </a>
      </Card>
   )
}