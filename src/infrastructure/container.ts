// Puertos (solo tipos)
import type { CatalogRepository } from '@/application/ports/CatalogRepository'
import type { OrderRepository } from '@/application/ports/OrderRepository'
import type { AuthGateway } from '@/application/ports/AuthGateway'

// Casos de uso
import { GetCategories } from '@/application/useCases/GetCategories'
import { GetCategoryById } from '@/application/useCases/GetCategoryById'
import { ListProducts } from '@/application/useCases/ListProducts'
import { GetProductById } from '@/application/useCases/GetProductById'
import { LoginUser } from '@/application/useCases/LoginUser'
import { RegisterCustomer } from '@/application/useCases/RegisterCustomer'
import { GetCurrentUser } from '@/application/useCases/GetCurrentUser'
import { PlaceOrder } from '@/application/useCases/PlaceOrder'
import { GetOrders } from '@/application/useCases/GetOrders.ts'
import { GetOrderById } from '@/application/useCases/GetOrderById'

// Adaptadores
import { createGraphqlClient } from './graphql/client'
import { GraphqlCatalogRepository } from './repositories/GraphqlCatalogRepository'
import { GraphqlOrderRepository } from './repositories/GraphqlOrderRepository.ts'
import { GraphqlAuthGateway } from './repositories/GraphqlAuthGateway.ts'

export interface Ports {
  catalog: CatalogRepository
  orders: OrderRepository
  auth: AuthGateway
}

/** Casos de uso cableados a los puertos que le pases (reales o falsos). */
export function createContainer(ports: Ports) {
  return {
    // catálogo
    getCategories: new GetCategories(ports.catalog),
    getCategoryById: new GetCategoryById(ports.catalog),
    listProducts: new ListProducts(ports.catalog),
    getProductById: new GetProductById(ports.catalog),

    // autenticación
    loginUser: new LoginUser(ports.auth),
    registerCustomer: new RegisterCustomer(ports.auth),
    getCurrentUser: new GetCurrentUser(ports.auth),

    // pedidos
    placeOrder: new PlaceOrder(ports.orders),
    getOrders: new GetOrders(ports.orders),
    getOrderById: new GetOrderById(ports.orders),
  } as const
}

export type Container = ReturnType<typeof createContainer>


const graphql = createGraphqlClient(import.meta.env.GRAPHQL_URL ?? 'http://localhost:4000/')

export const container = createContainer({
  catalog: new GraphqlCatalogRepository(graphql),
  orders: new GraphqlOrderRepository(graphql),
  auth: new GraphqlAuthGateway(graphql),
})
