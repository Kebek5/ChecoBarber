export interface Product {
  id: string
  name: string
  description: string
  price: number
  stock: number
  img: string
  category: { id: string; name: string } | null
}