import type { CategoryRef } from "./Category";

export type ProductId = string;

export interface Product {
   id: ProductId;
   name: string;
   description: string;
   price: number;
   stock: number;
   img: string;
   category: CategoryRef;
}

export const isInStock = (product: Product): boolean => product.stock > 0;

export const clampQuantity = (product: Product, requested: number): number => {
   if(!isInStock(product))
      return 0;

   const whole = Number.isFinite(requested) ? Math.trunc(requested) : 1;
   return Math.min(Math.max(whole, 1), product.stock);
}

export const remainingStock = (product: Product, inCart: number): number  => Math.max(product.stock - inCart, 0);

export const normalize = (text: string): string => {
   return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
}

export const matchesSearch = (product: Product, term: string): boolean => {
   const needle = normalize(term);

   return needle === '' || normalize(product.name).includes(needle);
}