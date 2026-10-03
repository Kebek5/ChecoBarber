import type { Cart } from '@/domain/cart/index'

export interface CartStorage {
   load(): Cart
   save(cart: Cart): void
}