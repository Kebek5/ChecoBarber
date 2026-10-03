import type { Category } from "./Category";
import type { Product } from "./Product";

export interface CategoryCatalog extends Category{
   readonly products: readonly Product[];
}