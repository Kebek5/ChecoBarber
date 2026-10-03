import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Cart, CartItem } from '@/domain/cart'
import type { CartStorage } from '@/application/ports/CartStorage'

interface CartState {
   items: readonly CartItem[]
}

export const useCartStore = create<CartState>()(
   persist(
      (): CartState => ({ items: [] }),
      { name: 'cart', version: 1 },   // si cambia la forma de CartItem, sube version y agrega `migrate`
   ),
)

export class ZustandCartStorage implements CartStorage {
   load(): Cart { return { items: useCartStore.getState().items } }
   save(cart: Cart): void { useCartStore.setState({ items: cart.items }) }
}