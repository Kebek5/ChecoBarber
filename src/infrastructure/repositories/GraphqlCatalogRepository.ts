import type { CatalogRepository } from '@/application/ports/CatalogRepository'
import type { Category } from '@/domain/catalog/Category'
import type { Product } from '@/domain/catalog/Product'
import type { GraphqlClient } from '@/infrastructure/graphql/client'
import {
  QUERY_CATEGORIES,
  QUERY_CATEGORY_BY_ID,
  QUERY_PRODUCT_BY_ID,
  QUERY_PRODUCTS,
} from '@/infrastructure/graphql/queries'

type CategoryDTO = Omit<Category, 'products'> & { products?: Omit<Product, 'category'>[] }

export class GraphqlCatalogRepository implements CatalogRepository {
  constructor(private readonly gql: GraphqlClient) {}

  async listCategories(): Promise<Category[]> {
    const res = await this.gql<{ categories: CategoryDTO[] }>(QUERY_CATEGORIES)
    return res.categories.map((c) => ({ ...c, products: [] }))
  }

  async findCategoryById(id: string): Promise<Category | null> {
    const res = await this.gql<{ category: CategoryDTO | null }>(QUERY_CATEGORY_BY_ID, { id })
    const c = res.category
    if (!c) return null
    const ref = { id: c.id, name: c.name }
    return { ...c, products: (c.products ?? []).map((p) => ({ ...p, category: ref })) }
  }

  async listProducts(params: { limit?: number; offset?: number } = {}): Promise<Product[]> {
    const res = await this.gql<{ products: Product[] }>(QUERY_PRODUCTS, params)
    return res.products
  }

  async findProductById(id: string): Promise<Product | null> {
    const res = await this.gql<{ product: Product | null }>(QUERY_PRODUCT_BY_ID, { id })
    return res.product ?? null
  }
}
