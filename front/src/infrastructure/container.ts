import { GetCategories } from '@/application/useCases/GetCategories'
import { GetCategoryById } from '@/application/useCases/GetCategoryById'
import { GetProductById } from '@/application/useCases/GetProductById'
import { ListProducts } from '@/application/useCases/ListProducts'
import { LoginUser } from '@/application/useCases/LoginUser'
import { RegisterUser } from '@/application/useCases/RegisterUser'
import { GetCurrentUser } from '@/application/useCases/GetCurrentUser'
import { ListUsers } from '@/application/useCases/ListUsers'
import { PlaceOrder } from '@/application/useCases/PlaceOrder'
import { ListAdminAppointments, UpdateAppointmentStatus} from '@/application/useCases/AppointmentAdmin'
import { GetDashboardSummary } from '@/application/useCases/GetDashboardSummary'
import { GetAdminOrder, ListAdminOrders, UpdateOrderStatus } from '@/application/useCases/OrderAdmin'
import { CreateProduct, DeleteProduct, UpdateProduct } from '@/application/useCases/ProductAdmin'
import { config } from '@/infrastructure/config'
import { createGraphqlClient } from '@/infrastructure/graphql/client'
import { GraphqlAdminGateway } from '@/infrastructure/repositories/GraphqlAdminGateway'
import { GraphqlAuthGateway } from '@/infrastructure/repositories/GraphqlAuthGateway'
import { GraphqlCatalogRepository } from '@/infrastructure/repositories/GraphqlCatalogRepository'
import { GraphqlOrderGateway } from '@/infrastructure/repositories/GraphqlOrderGateway'
import { GraphqlPaymentGateway } from '@/infrastructure/repositories/GraphqlPaymentGateway'

const graphql = createGraphqlClient(config.graphqlUrl)

const catalogRepository = new GraphqlCatalogRepository(graphql)
const orderGateway = new GraphqlOrderGateway(graphql)
const authGateway = new GraphqlAuthGateway(graphql)
const adminGateway = new GraphqlAdminGateway(graphql)

export const getCategories = new GetCategories(catalogRepository)
export const getCategoryById = new GetCategoryById(catalogRepository)
export const listProducts = new ListProducts(catalogRepository)
export const getProductById = new GetProductById(catalogRepository)
export const placeOrder = new PlaceOrder(orderGateway)

export const registerUser = new RegisterUser(authGateway)
export const loginUser = new LoginUser(authGateway)
export const getCurrentUser = new GetCurrentUser(authGateway)

export const getDashboardSummary = new GetDashboardSummary(
   adminGateway,
   adminGateway,
   adminGateway,
   catalogRepository
)

export const createProduct = new CreateProduct(adminGateway)
export const updateProduct = new UpdateProduct(adminGateway)
export const deleteProduct = new DeleteProduct(adminGateway)
export const listAdminOrders = new ListAdminOrders(adminGateway)
export const getAdminOrder = new GetAdminOrder(adminGateway)
export const updateOrderStatus = new UpdateOrderStatus(adminGateway)
export const listAdminAppointments = new ListAdminAppointments(adminGateway)
export const updateAppointmentStatus = new UpdateAppointmentStatus(adminGateway)
export const listUsers = new ListUsers(adminGateway)
export const paymentGateway = new GraphqlPaymentGateway(graphql)