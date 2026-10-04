import type { Product } from './Product'

export interface Category {
  id: string
  name: string
  description: string
  products: Product[]
}