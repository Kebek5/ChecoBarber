import type { CartItem } from '@/domain/cart/CartItem'

export interface CartStorage {
  load(): CartItem[]
  save(items: CartItem[]): void
}