import type { CartStorage } from '@/application/ports/CartStorage'
import { Cart, type CartProduct } from '@/domain/cart/Cart'

export class AddItemToCart {
  constructor(private readonly storage: CartStorage) {}

  execute(product: CartProduct): void {
    const cart = new Cart(this.storage.load()).add(product)
    this.storage.save(cart.items)
  }
}