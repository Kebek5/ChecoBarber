import type { Category } from "@/domain/catalog/Category";
import type { CategoryCatalog } from "@/domain/catalog/CategoryCatalog";
import type { Product } from "@/domain/catalog/Product";

export interface CatalogRepository {
   getCategories(): Promise<Category[]>,
   getCategoryById(id: string): Promise<CategoryCatalog | null>
   listProducts(limit: number, offset: number): Promise<Product[]>
   getProductById(id: string): Promise<Product | null>
}