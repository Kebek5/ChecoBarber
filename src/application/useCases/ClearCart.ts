import { emptyCart } from '@/domain/cart'
import type { CartStorage } from '../ports/CartStorage'

export class ClearCart {
   constructor(private storage: CartStorage) {}
   execute(): void { this.storage.save(emptyCart) }
}