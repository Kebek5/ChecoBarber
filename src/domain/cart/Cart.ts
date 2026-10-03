import type { Product } from '../catalog/Product'
import { remainingStock } from '../catalog/Product'
import { roundMoney } from '../shared/Money'
import { itemSubtotal, toCartItem, type CartItem } from './CartItem'

export interface Cart {
   readonly items: readonly CartItem[];
}

export const emptyCart: Cart = { items: [] }

export const FREE_SHIPPING_THRESHOLD = 500;

export class StockLimitError extends Error {
   readonly available: number
   constructor(available: number) {
      super(
         available > 0
         ? `Solo puedes agregar ${available} más de este producto.`
         : 'Ya tienes todo el stock disponible en tu carrito.',
      )
      this.name = 'StockLimitError'
      this.available = available
   }
}

const quantityInCart = (cart: Cart, productId: string): number =>
   cart.items.find((i) => i.productId === productId)?.quantity ?? 0

/** Reemplaza `addItem` del store, ahora validando contra el stock. */
export function addItem(cart: Cart, product: Product, quantity: number): Cart {
   if (!Number.isInteger(quantity) || quantity < 1)
      throw new Error('La cantidad debe ser un entero mayor o igual a 1.')

   const available = remainingStock(product, quantityInCart(cart, product.id))
   if (quantity > available) throw new StockLimitError(available)

   const exists = cart.items.some((i) => i.productId === product.id)
   
   return exists ? { items: cart.items.map((i) =>
         i.productId === product.id
            ? { ...i, quantity: i.quantity + quantity, stock: product.stock }
            : i) }
      : { items: [...cart.items, toCartItem(product, quantity)] }
}

export function removeItem(cart: Cart, productId: string): Cart {
   return { items: cart.items.filter((i) => i.productId !== productId) }
}

/** Reemplaza `updateQuantity`: <= 0 elimina; nunca pasa del stock. */
export function updateQuantity(cart: Cart, productId: string, quantity: number): Cart {
   if (!Number.isFinite(quantity)) return cart
   if (quantity <= 0) return removeItem(cart, productId)
   return { items: cart.items.map((i) =>
      i.productId === productId ? { ...i, quantity: Math.min(Math.trunc(quantity), i.stock) } : i) }
   }

/* Reemplazan selectTotalItems / selectTotalPrice */
export const totalItems = (cart: Cart): number =>
   cart.items.reduce((sum, i) => sum + i.quantity, 0)

export const totalPrice = (cart: Cart): number =>
   roundMoney(cart.items.reduce((sum, i) => sum + itemSubtotal(i), 0))

export const isEmpty = (cart: Cart): boolean => cart.items.length === 0

export const qualifiesForFreeShipping = (cart: Cart): boolean =>
   totalPrice(cart) >= FREE_SHIPPING_THRESHOLD