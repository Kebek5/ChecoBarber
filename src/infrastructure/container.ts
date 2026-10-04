// Solo para el servidor (páginas .astro y endpoints).
// El carrito se arma aparte en infrastructure/cart/zustandCartStore.ts
import { GetCategories } from '@/application/useCases/GetCategories'
import { GetCategoryById } from '@/application/useCases/GetCategoryById'
import { GetProductById } from '@/application/useCases/GetProductById'
import { ListProducts } from '@/application/useCases/ListProducts'
import { LoginUser } from '@/application/useCases/LoginUser'
import { PlaceOrder } from '@/application/useCases/PlaceOrder'
import { RegisterUser } from '@/application/useCases/RegisterUser'
import { ScryptPasswordHasher } from '@/infrastructure/auth/ScryptPasswordHasher'
import { PostgresCatalogRepository } from '@/infrastructure/repositories/PostgresCatalogRepository'
import { PostgresOrderGateway } from '@/infrastructure/repositories/PostgresOrderGateway'
import { PostgresUserRepository } from '@/infrastructure/repositories/PostgresUserRepository'

const catalogRepository = new PostgresCatalogRepository()
const orderGateway = new PostgresOrderGateway()
const userRepository = new PostgresUserRepository()
const passwordHasher = new ScryptPasswordHasher()

export const getCategories = new GetCategories(catalogRepository)
export const getCategoryById = new GetCategoryById(catalogRepository)
export const listProducts = new ListProducts(catalogRepository)
export const getProductById = new GetProductById(catalogRepository)
export const placeOrder = new PlaceOrder(orderGateway)

export const registerUser = new RegisterUser(userRepository, passwordHasher)
export const loginUser = new LoginUser(userRepository, passwordHasher)