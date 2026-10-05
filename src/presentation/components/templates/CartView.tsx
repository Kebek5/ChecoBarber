import { MinusIcon, PlusIcon, ShoppingCartIcon } from '@phosphor-icons/react'
import { addItemToCart, useCartStore } from '@/infrastructure/cart/zustandCartStore'
import { Badge } from '@/presentation/components/ui/badge'
import { Button, buttonVariants } from '@/presentation/components/ui/button'
import { Card } from '@/presentation/components/ui/card'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/presentation/components/ui/empty'
import { Separator } from '@/presentation/components/ui/separator'

export default function CartView() {
  const items = useCartStore((state) => state.items)
  const removeFromCart = useCartStore((state) => state.removeFromCart)
  const deleteFromCart = useCartStore((state) => state.deleteFromCart)
  const totalPrice = useCartStore((state) => state.getTotalPrice())
  const totalItems = useCartStore((state) => state.getTotalItems())

  return (
    <div className="mx-auto w-full max-w-350 px-7.5 py-12.5">
      <div className="mb-9 flex items-end justify-between gap-8">
        <div>
          <Badge variant="outline" className="mb-2.5 uppercase tracking-wider">
            Tu compra
          </Badge>
          <h1 className="mb-2 text-[clamp(32px,5vw,52px)] font-bold leading-tight">Carrito</h1>
          <p className="text-muted-foreground">{totalItems} producto(s) en tu carrito</p>
        </div>
        <a href="/" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
          Seguir comprando
        </a>
      </div>

      {items.length === 0 ? (
        <Empty className="min-h-100 rounded-xl border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ShoppingCartIcon />
            </EmptyMedia>
            <EmptyTitle>Tu carrito está vacío</EmptyTitle>
            <EmptyDescription>Agrega algunos productos para comenzar tu compra.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <a href="/" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
              Ver productos
            </a>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="grid items-start gap-7.5 lg:grid-cols-[1fr_320px]">
          <section className="flex flex-col gap-4">
            {items.map((item) => (
              <Card
                key={item.id}
                className="grid grid-cols-[72px_1fr] items-center gap-4 p-4 shadow-[0_0_15px_#2222] sm:grid-cols-[90px_1fr_auto_auto_auto] sm:gap-4.5 sm:p-4.5"
              >
                <div className="relative flex size-18 items-center justify-center overflow-hidden rounded-lg bg-muted sm:size-22.5">
                  <span className="text-xs text-muted-foreground">Sin imagen</span>
                  {item.img && (
                    <img
                      src={item.img}
                      alt={item.name}
                      className="absolute inset-0 size-full bg-muted object-contain"
                      onError={(e) => e.currentTarget.remove()}
                    />
                  )}
                </div>

                <div className="min-w-0">
                  <h2 className="mb-1.5 text-[17px] font-bold">{item.name}</h2>
                  <span className="text-xs text-muted-foreground">${item.price.toFixed(2)} por unidad</span>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" aria-label="Quitar una unidad" onClick={() => removeFromCart(item.id)}>
                    <MinusIcon weight="bold" />
                  </Button>
                  <span className="min-w-6 text-center font-bold">{item.quantity}</span>
                  <Button variant="outline" size="icon" aria-label="Agregar una unidad" onClick={() => addItemToCart.execute(item)}>
                    <PlusIcon weight="bold" />
                  </Button>
                </div>

                <strong className="whitespace-nowrap">${(item.price * item.quantity).toFixed(2)}</strong>

                <Button variant="outline" size="sm" onClick={() => deleteFromCart(item.id)}>
                  Eliminar
                </Button>
              </Card>
            ))}
          </section>

          <Card className="sticky top-28 gap-0 bg-muted/40 p-6">
            <h2 className="mb-5 text-xl font-bold">Resumen</h2>
            <div className="flex items-center justify-between py-2.5 text-muted-foreground">
              <span>Productos</span>
              <span>{totalItems}</span>
            </div>
            <div className="flex items-center justify-between py-2.5 text-muted-foreground">
              <span>Subtotal</span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>
            <Separator className="my-2.5" />
            <div className="flex items-center justify-between pt-2.5">
              <span>Total</span>
              <strong className="text-xl">${totalPrice.toFixed(2)}</strong>
            </div>
            <a href="/checkout" className={buttonVariants({ size: 'lg', className: 'mt-5 w-full' })}>
              Continuar al checkout
            </a>
          </Card>
        </div>
      )}
    </div>
  )
}