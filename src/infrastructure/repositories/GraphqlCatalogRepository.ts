import type { CatalogRepository } from "@/application/ports/CatalogRepository";
import type { GraphqlClient } from "../graphql/client";
import type { CategoryDTO, ProductDTO } from '../graphql/dto'

import { QUERY_CATEGORIES, QUERY_CATEGORY_BY_ID, QUERY_PRODUCT_BY_ID, QUERY_PRODUCTS, } from "../graphql/queries";
import { toCategory, toCategoryCatalog, toProduct } from "../graphql/mappers";

export class GraphqlCatalogRepository implements CatalogRepository {
   constructor(private readonly gql: GraphqlClient) {}
   
   async getCategoryById(id: string){
      const data = await this.gql<{ category: CategoryDTO | null }>(QUERY_CATEGORY_BY_ID, { id })
      return data.category ? toCategoryCatalog(data.category) : null;
   }

   async getCategories() {
      const data = await this.gql<{ categories: CategoryDTO[] }>(QUERY_CATEGORIES)

      return data.categories.map((c) => toCategory(c))
   }

   async listProducts(limit: number, offset: number) {
      const data = await this.gql<{ products: ProductDTO[] }>(QUERY_PRODUCTS, { limit, offset })

      return data.products.map((p)=> toProduct(p));
   }

   async getProductById(id: string) {
      const data = await this.gql<{ product: ProductDTO | null }>(QUERY_PRODUCT_BY_ID, { id })
      return data.product ? toProduct(data.product) : null
   }
}