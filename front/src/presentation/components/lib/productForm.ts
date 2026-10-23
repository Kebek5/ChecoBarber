import type { Product } from '@/domain/catalog/Product'
import type { ProductInput } from '@/domain/catalog/ProductInput'

export interface ProductFormValues {
   name: string
   description: string
   price: string
   stock: string
   categoryId: string
   img: string
}

export const emptyProductForm: ProductFormValues = {
   name: '', description: '', price: '', stock: '', categoryId: '', img: '',
}

export const productToForm = (product: Product): ProductFormValues => ({
   name: product.name,
   description: product.description,
   price: String(product.price),
   stock: String(product.stock),
   categoryId: product.category?.id ?? '',
   img: product.img ?? '',
})

export const readProductForm = (form: FormData): ProductFormValues => {
   const get = (key: string) => String(form.get(key) ?? '')
   return {
      name: get('name'),
      description: get('description'),
      price: get('price'),
      stock: get('stock'),
      categoryId: get('categoryId'),
      img: get('img'),
   }
}

const toNumber = (raw: string) => (raw.trim() === '' ? Number.NaN : Number(raw.trim().replace(',', '.')))

export const toProductInput = (values: ProductFormValues): ProductInput => ({
   name: values.name.trim(),
   description: values.description.trim(),
   price: toNumber(values.price),
   stock: toNumber(values.stock),
   categoryId: values.categoryId,
   img: values.img.trim(),
})