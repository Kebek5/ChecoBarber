import { addItem, type Cart } from '@/domain/cart/index.ts'
import type { Product } from '@/domain/catalog/index'
import type { CartStorage } from '../ports/CartStorage'

export class AddItemToCart {
   constructor(private storage: CartStorage) {}

   execute(product: Product, quantity: number): Cart {
      const next = addItem(this.storage.load(), product, quantity)  // puede lanzar StockLimitError
      this.storage.save(next)
      return next
   }
}