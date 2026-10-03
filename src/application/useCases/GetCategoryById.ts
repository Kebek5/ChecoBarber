import type { CatalogRepository } from "../ports/CatalogRepository";

export class GetCategoryById {
   constructor(private catalog: CatalogRepository) {}
   execute(id: string){return this.catalog.getCategoryById(id) }
}