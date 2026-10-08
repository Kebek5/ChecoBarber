import type { Category } from '@/domain/catalog/Category'
import type { Product } from '@/domain/catalog/Product'

export interface CatalogRepository {
  listCategories(): Promise<Category[]>
  findCategoryById(id: string): Promise<Category | null>
  listProducts(params?: { limit?: number; offset?: number }): Promise<Product[]>
  findProductById(id: string): Promise<Product | null>
}