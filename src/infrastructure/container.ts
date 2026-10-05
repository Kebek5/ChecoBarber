import { GetCategories } from '@/application/useCases/GetCategories'
import { GetCategoryById } from '@/application/useCases/GetCategoryById'
import { GetCurrentUser } from '@/application/useCases/GetCurrentUser'
import { GetProductById } from '@/application/useCases/GetProductById'
import { ListProducts } from '@/application/useCases/ListProducts'
import { LoginUser } from '@/application/useCases/LoginUser'
import { PlaceOrder } from '@/application/useCases/PlaceOrder'
import { RegisterUser } from '@/application/useCases/RegisterUser'
import { config } from '@/infrastructure/config'
import { createGraphqlClient } from '@/infrastructure/graphql/client'
import { GraphqlAuthGateway } from '@/infrastructure/repositories/GraphqlAuthGateway'
import { GraphqlCatalogRepository } from '@/infrastructure/repositories/GraphqlCatalogRepository'
import { GraphqlOrderGateway } from '@/infrastructure/repositories/GraphqlOrderGateway'

const graphql = createGraphqlClient(config.graphqlUrl)

const catalogRepository = new GraphqlCatalogRepository(graphql)
const orderGateway = new GraphqlOrderGateway(graphql)
const authGateway = new GraphqlAuthGateway(graphql)

export const getCategories = new GetCategories(catalogRepository)
export const getCategoryById = new GetCategoryById(catalogRepository)
export const listProducts = new ListProducts(catalogRepository)
export const getProductById = new GetProductById(catalogRepository)
export const placeOrder = new PlaceOrder(orderGateway)

export const registerUser = new RegisterUser(authGateway)
export const loginUser = new LoginUser(authGateway)
export const getCurrentUser = new GetCurrentUser(authGateway)