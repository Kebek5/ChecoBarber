import type { CatalogRepository } from '@/application/ports/CatalogRepository'
import type { Category } from '@/domain/catalog/Category'

export class GetCategoryById {
  constructor(private readonly catalog: CatalogRepository) {}

  execute(id: string): Promise<Category | null> {
    return this.catalog.findCategoryById(id)
  }
}