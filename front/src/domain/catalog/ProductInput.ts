export interface ProductInput{
   name: string
   description: string
   price: number
   stock: number
   categoryId: string
   img: string
}

export function validateProductInput(input: ProductInput): string[] {
   const errors: string[] = []
   if (input.name.trim().length < 3) errors.push('El nombre debe tener al menos 3 caracteres.')
   if (input.description.trim() === '') errors.push('Escribe una descripción.')
   if (!Number.isFinite(input.price) || input.price <= 0) errors.push('El precio debe ser mayor a 0.')
   if (!Number.isInteger(input.stock) || input.stock < 0) {
      errors.push('El stock debe ser un número entero de 0 o más.')
   }
   if (!input.categoryId) errors.push('Elige una categoría.')
   return errors
}