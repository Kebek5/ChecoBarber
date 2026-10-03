import type { Category, CategoryCatalog, CategoryRef, Product } from '@/domain/catalog'
import type { Order, OrderRequest } from '@/domain/order/index'
import type { Session, User } from '@/domain/auth'
import type { AuthPayloadDTO, CategoryDTO, OrderDTO, ProductDTO, UserDTO } from './dto'

export const toCategory = (dto: CategoryDTO): Category => ({
   id: dto.id, name: dto.name, description: dto.description,
})

export const toProduct = (dto: ProductDTO, parent?: CategoryRef): Product => {
   const category = dto.category ?? parent
   if (!category) throw new Error(`El producto ${dto.id} llegó sin categoría.`)
   return {
      id: dto.id, name: dto.name, description: dto.description,
      price: dto.price, stock: dto.stock, img: dto.img, category,
   }
}

export const toCategoryCatalog = (dto: CategoryDTO): CategoryCatalog => {
   const ref = { id: dto.id, name: dto.name }
   return { ...toCategory(dto), products: (dto.products ?? []).map((p) => toProduct(p, ref)) }
}

export const toUser = (dto: UserDTO): User => ({
   id: dto.id, name: dto.name, tel: dto.tel, email: dto.email, role: dto.role,
})

export const toSession = (dto: AuthPayloadDTO): Session => ({
   token: dto.token, user: toUser(dto.user),
})

export const toOrder = (dto: OrderDTO): Order => ({
   id: dto.id, date: dto.date, status: dto.status, total: dto.total,
   customer: { id: dto.client.id, name: dto.client.name },
   lines: dto.lines.map((l) => ({
      id: l.id, productId: l.product.id, productName: l.product.name,
      quantity: l.amount, unitPrice: l.unitPrice,
   })),
})

/** Reemplaza buildOrderInput: aquí vive la traducción productId/quantity → idProduct/amount. */
export const toOrderInput = (request: OrderRequest) => ({
   lines: request.lines.map((l) => ({ idProduct: l.productId, amount: l.quantity })),
})