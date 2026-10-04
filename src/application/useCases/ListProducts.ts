import type { CatalogRepository } from '@/application/ports/CatalogRepository'
import type { Product } from '@/domain/catalog/Product'

export class ListProducts {
  constructor(private readonly catalog: CatalogRepository) {}

  execute(params?: { limit?: number; offset?: number }): Promise<Product[]> {
    return this.catalog.listProducts(params)
  }
}