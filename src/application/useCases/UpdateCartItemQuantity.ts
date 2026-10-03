import { updateQuantity, type Cart } from '@/domain/cart'
import type { CartStorage } from '../ports/CartStorage'

export class UpdateCartItemQuantity {
   constructor(private storage: CartStorage) {}
   execute(productId: string, quantity: number): Cart {
      const next = updateQuantity(this.storage.load(), productId, quantity)
      this.storage.save(next)
      return next
   }
}