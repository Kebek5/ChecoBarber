import type { Product } from '../catalog/Product'
import type { CartItem } from './CartItem'

export type CartProduct = Pick<Product, 'id' | 'name' | 'price' | 'img'>

export class Cart {
  readonly items: CartItem[]

  constructor(items: CartItem[] = []) {
    this.items = items
  }

  // Añadir producto o incrementar su cantidad si ya existe
  add(product: CartProduct): Cart {
    const existing = this.items.find((item) => item.id === product.id)

    if (existing) {
      return new Cart(
        this.items.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      )
    }

    return new Cart([
      ...this.items,
      { id: product.id, name: product.name, price: product.price, img: product.img, quantity: 1 },
    ])
  }

  // Decrementar cantidad o remover si llega a 0
  remove(productId: string): Cart {
    const existing = this.items.find((item) => item.id === productId)
    if (!existing) return this

    if (existing.quantity === 1) {
      return new Cart(this.items.filter((item) => item.id !== productId))
    }

    return new Cart(
      this.items.map((item) =>
        item.id === productId ? { ...item, quantity: item.quantity - 1 } : item
      )
    )
  }

  // Eliminar un producto por completo sin importar su cantidad
  delete(productId: string): Cart {
    return new Cart(this.items.filter((item) => item.id !== productId))
  }

  clear(): Cart {
    return new Cart([])
  }

  get totalPrice(): number {
    return this.items.reduce((acc, item) => acc + item.price * item.quantity, 0)
  }

  get totalItems(): number {
    return this.items.reduce((acc, item) => acc + item.quantity, 0)
  }
}