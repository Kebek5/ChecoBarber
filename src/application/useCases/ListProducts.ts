import type { CatalogRepository } from "../ports/CatalogRepository"

export class ListProducts {
   constructor(private catalog: CatalogRepository) {}
   execute(limit = 12, offset = 0) { return this.catalog.listProducts(limit, offset) }
}