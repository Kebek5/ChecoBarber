export interface CategoryRefDTO { id: string; name: string }

export interface ProductDTO {
   id: string; name: string; description: string
   price: number; stock: number; img: string
   category?: CategoryRefDTO | null
}

export interface CategoryDTO {
   id: string; name: string; description: string
   products?: ProductDTO[]
}

export interface UserDTO {
   id: string; name: string; tel: string; email: string
   role: 'ADMIN' | 'CLIENT'
}

export interface AuthPayloadDTO { token: string; user: UserDTO }

export interface OrderDTO {
   id: string; date: string; total: number
   status: 'PENDING' | 'IN_PROCESS' | 'COMPLETED'
   client: { id: string; name: string }
   lines: { id: string; amount: number; unitPrice: number; product: { id: string; name: string } }[]
}