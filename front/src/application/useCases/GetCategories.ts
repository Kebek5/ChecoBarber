import type { CatalogRepository } from '@/application/ports/CatalogRepository'
import type { Category } from '@/domain/catalog/Category'

export class GetCategories {
  constructor(private readonly catalog: CatalogRepository) {}

  execute(): Promise<Category[]> {
    return this.catalog.listCategories()
  }
}