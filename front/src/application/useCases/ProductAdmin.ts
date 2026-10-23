import { InvalidInputError } from '@/application/errors'
import type { AdminCatalogGateway } from '@/application/ports/AdminGateway'
import { validateProductInput, type ProductInput } from '@/domain/catalog/ProductInput'
import type { Product } from '@/domain/catalog/Product'

function assertValid(input: ProductInput): void {
   const errors = validateProductInput(input)
   if (errors.length > 0) throw new InvalidInputError(errors.join(' '))
}

export class CreateProduct {
   constructor(private readonly catalog: AdminCatalogGateway) {}

   async execute(token: string, input: ProductInput): Promise<Product> {
      assertValid(input)
      return this.catalog.createProduct(token, input)
   }
}

export class UpdateProduct {
   constructor(private readonly catalog: AdminCatalogGateway) {}

   async execute(token: string, id: string, input: ProductInput): Promise<Product> {
      assertValid(input)
      const product = await this.catalog.updateProduct(token, id, input)
      if (!product) throw new InvalidInputError('El producto no existe.')
      return product
   }
}

export class DeleteProduct {
   constructor(private readonly catalog: AdminCatalogGateway) {}

   async execute(token: string, id: string): Promise<void> {
      const deleted = await this.catalog.deleteProduct(token, id)
      if (!deleted) throw new InvalidInputError('El producto no existe.')
   }
}