import { useState, type FormEvent } from 'react'
import { useCartStore } from '@/infrastructure/cart/zustandCartStore'
import { buttonVariants } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'

interface CheckoutProps {
  userName: string
}

export default function Checkout({ userName }: CheckoutProps) {
  const cart = useCartStore((state) => state.items)
  const clearCart = useCartStore((state) => state.clearCart)
  const totalCart = useCartStore((state) => state.getTotalPrice())

  const [isProcessing, setIsProcessing] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePayment = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsProcessing(true)
    setError(null)

    // El cliente lo toma el servidor de la sesión, aquí solo van los renglones
    const orderData = {
      lines: cart.map((item) => ({
        productId: String(item.id),
        amount: item.quantity,
      })),
    }

    try {
      const response = await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      })
      const result = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(result.error || 'Ocurrió un error inesperado al procesar tu pedido.')
      }

      setIsSuccess(true)
      clearCart()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado al procesar tu pedido.')
    } finally {
      setIsProcessing(false)
    }
  }

  // Pantalla de éxito tras confirmar inserción en la base de datos
  if (isSuccess) {
    return (
      <div className="mx-auto max-w-lg p-10 text-center">
        <h2 className="text-base font-bold text-green-600">🎉 ¡Compra Guardada con Éxito!</h2>
        <p className="mt-2">Tu orden ha sido registrada en nuestro sistema de base de datos de manera correcta.</p>
        <a href="/" className={buttonVariants({ size: 'lg', className: 'mt-5' })}>
          Volver a la Tienda Principal
        </a>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl p-5">
      <h2 className="mb-4 text-base font-bold">Finalizar Compra (Checkout)</h2>

      {error && (
        <div className="mb-4 border border-destructive/40 bg-destructive/10 p-2.5 text-destructive">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Resumen rápido de lo que se va a insertar en la base de datos */}
      <div className="mb-5 border bg-muted/40 p-4">
        <h4 className="font-bold">Resumen de Compra ({cart.length} productos)</h4>
        <h3 className="mt-1 font-bold">Total a pagar: ${totalCart.toFixed(2)}</h3>
      </div>

      <form onSubmit={handlePayment} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="nombre" className="text-xs font-bold">Nombre Completo</label>
          <Input id="nombre" type="text" required defaultValue={userName} placeholder="Juan Pérez" disabled={isProcessing} />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="direccion" className="text-xs font-bold">Dirección de Envío</label>
          <Input id="direccion" type="text" required placeholder="Av. Siempre Viva 742" disabled={isProcessing} />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="tarjeta" className="text-xs font-bold">Tarjeta de Crédito / Débito</label>
          <Input id="tarjeta" type="text" inputMode="numeric" required maxLength={16} placeholder="4000 1234 5678 9010" disabled={isProcessing} />
        </div>

        <div className="mt-5 flex justify-between">
          <a href="/" className={buttonVariants({ variant: 'destructive', size: 'lg' })}>
            ❌ Cancelar Orden
          </a>

          <button
            type="submit"
            disabled={isProcessing || cart.length === 0}
            className={buttonVariants({ size: 'lg' })}
          >
            {isProcessing ? 'Procesando en Servidor...' : 'Confirmar y Pagar 💳'}
          </button>
        </div>
      </form>
    </div>
  )
}