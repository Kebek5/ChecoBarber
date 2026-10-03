import { removeItem, type Cart } from '@/domain/cart'
import type { CartStorage } from '../ports/CartStorage'

export class RemoveCartItem {
   constructor(private storage: CartStorage) {}
   execute(productId: string): Cart {
      const next = removeItem(this.storage.load(), productId)
      this.storage.save(next)
      return next
   }
}
