import type { CatalogRepository } from '../ports/CatalogRepository'

export class GetProductById {
   constructor(private catalog: CatalogRepository) {}
   execute(id: string) { return this.catalog.getProductById(id) }
}