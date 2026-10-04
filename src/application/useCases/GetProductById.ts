import type { CatalogRepository } from '@/application/ports/CatalogRepository'
import type { Product } from '@/domain/catalog/Product'

export class GetProductById {
  constructor(private readonly catalog: CatalogRepository) {}

  execute(id: string): Promise<Product | null> {
    return this.catalog.findProductById(id)
  }
}