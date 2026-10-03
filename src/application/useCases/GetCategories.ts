import type { CatalogRepository } from "../ports/CatalogRepository";

export class GetCategories {
   constructor(private catalog: CatalogRepository) {}
   execute(){return this.catalog.getCategories() }
}