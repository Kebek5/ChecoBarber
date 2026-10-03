import { AddItemToCart } from '@/application/useCases/AddItemToCart'
import { UpdateCartItemQuantity } from '@/application/useCases/UpdateCartItemQuantity'
import { RemoveCartItem } from '@/application/useCases/RemoveCartItem'
import { ClearCart } from '@/application/useCases/ClearCart'
import { ZustandCartStorage, useCartStore } from './cart/zustandCartStore'

const storage = new ZustandCartStorage()

export const clientContainer = {
   addItemToCart: new AddItemToCart(storage),
   updateCartItemQuantity: new UpdateCartItemQuantity(storage),
   removeCartItem: new RemoveCartItem(storage),
   clearCart: new ClearCart(storage),
} as const

export { useCartStore }   // lectura reactiva en las islas