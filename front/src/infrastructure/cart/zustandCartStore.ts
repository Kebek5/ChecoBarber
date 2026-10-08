import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartStorage } from '@/application/ports/CartStorage'
import { AddItemToCart } from '@/application/useCases/AddItemToCart'
import { Cart } from '@/domain/cart/Cart'
import type { CartItem } from '@/domain/cart/CartItem'

interface CartState {
  items: CartItem[]
  removeFromCart: (productId: string) => void
  deleteFromCart: (productId: string) => void
  clearCart: () => void
  getTotalPrice: () => number
  getTotalItems: () => number
}

// Se guarda en localStorage para que el carrito sobreviva al cambiar de página
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      // Decrementar cantidad o remover si llega a 0
      removeFromCart: (productId) => {
        set({ items: new Cart(get().items).remove(productId).items })
      },

      // Eliminar un producto por completo sin importar su cantidad
      deleteFromCart: (productId) => {
        set({ items: new Cart(get().items).delete(productId).items })
      },

      // Limpiar el carrito (usado al completar el Checkout)
      clearCart: () => set({ items: [] }),

      getTotalPrice: () => new Cart(get().items).totalPrice,

      getTotalItems: () => new Cart(get().items).totalItems,
    }),
    {
      name: 'checobarber-cart',
      partialize: (state) => ({ items: state.items }),
    }
  )
)

// El store cumple el puerto CartStorage
export const zustandCartStorage: CartStorage = {
  load: () => useCartStore.getState().items,
  save: (items) => useCartStore.setState({ items }),
}

export const addItemToCart = new AddItemToCart(zustandCartStorage)