import { addItemToCart, useCartStore } from '@/infrastructure/cart/zustandCartStore'
import { Button, buttonVariants } from '@/presentation/components/ui/button'

export default function CartView() {
  const items = useCartStore((state) => state.items)
  const removeFromCart = useCartStore((state) => state.removeFromCart)
  const deleteFromCart = useCartStore((state) => state.deleteFromCart)
  const totalPrice = useCartStore((state) => state.getTotalPrice())

  return (
    <div className="mx-auto max-w-3xl p-5">
      <h2 className="mb-4 text-base font-bold">Tu Carrito de Compras</h2>

      {items.length === 0 ? (
        <div className="mt-10 text-center">
          <p>Tu carrito está vacío.</p>
          <a href="/" className={buttonVariants({ variant: 'outline', size: 'lg', className: 'mt-4' })}>
            Volver a la Tienda
          </a>
        </div>
      ) : (
        <>
          <div className="mb-5 border p-4">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between border-b py-2.5">
                <div>
                  <h4 className="mb-1 font-bold">{item.name}</h4>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="xs" onClick={() => removeFromCart(item.id)}>
                      -
                    </Button>
                    <span>{item.quantity}</span>
                    <Button variant="outline" size="xs" onClick={() => addItemToCart.execute(item)}>
                      +
                    </Button>
                    <Button
                      variant="ghost"
                      size="xs"
                      className="ml-2.5 text-destructive"
                      onClick={() => deleteFromCart(item.id)}
                    >
                      Eliminar
                    </Button>
                  </div>
                </div>
                <strong>${(item.price * item.quantity).toFixed(2)}</strong>
              </div>
            ))}

            <div className="mt-4 flex justify-between border-t-2 pt-4">
              <h3 className="font-bold">Total:</h3>
              <h3 className="font-bold">${totalPrice.toFixed(2)}</h3>
            </div>
          </div>

          <div className="flex justify-between">
            <a href="/" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
              ⬅ Seguir Comprando
            </a>
            <a href="/checkout" className={buttonVariants({ size: 'lg' })}>
              Proceder al Pago ➡
            </a>
          </div>
        </>
      )}
    </div>
  )
}