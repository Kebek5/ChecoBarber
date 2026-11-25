import { MinusIcon } from '@phosphor-icons/react/dist/csr/Minus'
import { PlusIcon } from '@phosphor-icons/react/dist/csr/Plus'
import { ShoppingCartIcon } from '@phosphor-icons/react/dist/csr/ShoppingCart'
import { addItemToCart, useCartStore } from '@/infrastructure/cart/zustandCartStore'
import { t, type Lang } from '@/i18n/ui'
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

export default function CartView({ lang = 'es', homeHref = '/' }: { lang?: Lang; homeHref?: string }) {
  const items = useCartStore((state) => state.items)
  const removeFromCart = useCartStore((state) => state.removeFromCart)
  const deleteFromCart = useCartStore((state) => state.deleteFromCart)
  const totalPrice = useCartStore((state) => state.getTotalPrice())
  const totalItems = useCartStore((state) => state.getTotalItems())
  const home = homeHref

  return (
    <div className="mx-auto w-full max-w-350 px-4 py-8 md:px-7.5 md:py-12.5">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 md:mb-9 md:gap-8">
        <div className="min-w-0">
          <Badge variant="outline" className="mb-2.5 uppercase tracking-wider">
            {t(lang, 'cartYourOrder')}
          </Badge>
          <h1 className="mb-2 text-[clamp(30px,5vw,52px)] font-bold leading-tight">{t(lang, 'cartHeading')}</h1>
          <p className="text-muted-foreground">{t(lang, 'cartCount', { n: totalItems })}</p>
        </div>
        <a href={home} className={buttonVariants({ variant: 'outline', size: 'lg' })}>
          {t(lang, 'keepShopping')}
        </a>
      </div>

      {items.length === 0 ? (
        <Empty className="min-h-100 rounded-xl border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ShoppingCartIcon />
            </EmptyMedia>
            <EmptyTitle>{t(lang, 'cartEmpty')}</EmptyTitle>
            <EmptyDescription>{t(lang, 'cartEmptyHint')}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <a href={home} className={buttonVariants({ variant: 'outline', size: 'lg' })}>
              {t(lang, 'heroShop')}
            </a>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="grid items-start gap-6 md:gap-7.5 xl:grid-cols-[1fr_320px]">
          <section className="flex min-w-0 flex-col gap-4">
            {items.map((item) => (
              <Card
                key={item.id}
                className="grid grid-cols-[72px_1fr] items-center gap-4 p-4 shadow-[0_0_15px_#2222] sm:grid-cols-[90px_1fr_auto_auto_auto] sm:gap-4.5 sm:p-4.5"
              >
                <div className="relative flex size-18 items-center justify-center overflow-hidden rounded-lg bg-muted sm:size-22.5">
                  <span className="text-xs text-muted-foreground">{t(lang, 'noImage')}</span>
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
                  <h2 className="mb-1.5 text-[17px] font-bold wrap-break-word">{item.name}</h2>
                  <span className="text-xs text-muted-foreground">
                    ${item.price.toFixed(2)} {t(lang, 'perUnit')}
                  </span>
                </div>

                {/* En móvil ocupa una fila completa; desde 640 px sus hijos vuelven a la rejilla */}
                <div className="col-span-2 flex flex-wrap items-center justify-between gap-3 sm:contents">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" aria-label={t(lang, 'removeOne')} onClick={() => removeFromCart(item.id)}>
                      <MinusIcon weight="bold" />
                    </Button>
                    <span className="min-w-6 text-center font-bold">{item.quantity}</span>
                    <Button variant="outline" size="icon" aria-label={t(lang, 'addOne')} onClick={() => addItemToCart.execute(item)}>
                      <PlusIcon weight="bold" />
                    </Button>
                  </div>

                  <strong className="whitespace-nowrap">${(item.price * item.quantity).toFixed(2)}</strong>

                  <Button variant="outline" size="sm" onClick={() => deleteFromCart(item.id)}>
                    {t(lang, 'remove')}
                  </Button>
                </div>
              </Card>
            ))}
          </section>

          <Card className="gap-0 bg-muted/40 p-6 xl:sticky xl:top-28">
            <h2 className="mb-5 text-xl font-bold">{t(lang, 'summary')}</h2>
            <div className="flex items-center justify-between py-2.5 text-muted-foreground">
              <span>{t(lang, 'products')}</span>
              <span>{totalItems}</span>
            </div>
            <div className="flex items-center justify-between py-2.5 text-muted-foreground">
              <span>{t(lang, 'subtotal')}</span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>
            <Separator className="my-2.5" />
            <div className="flex items-center justify-between pt-2.5">
              <span>{t(lang, 'total')}</span>
              <strong className="text-xl">${totalPrice.toFixed(2)}</strong>
            </div>
            <a href="/checkout" className={buttonVariants({ size: 'lg', className: 'mt-5 w-full' })}>
              {t(lang, 'checkout')}
            </a>
          </Card>
        </div>
      )}
    </div>
  )
}