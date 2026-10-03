import type { Product, ProductId } from '../catalog/Product';
import { roundMoney } from '../shared/Money';

export interface CartItem {
   readonly productId: ProductId
   readonly name: string
   readonly price: number
   readonly img: string
   readonly quantity: number
   readonly stock: number
}

export const toCartItem = (product: Product, quantity: number): CartItem => ({
   productId: product.id,
   name: product.name,
   price: product.price,
   img: product.img,
   quantity,
   stock: product.stock,
})

export const itemSubtotal = (item: CartItem): number => roundMoney(item.price * item.quantity)