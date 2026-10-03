export const QUERY_CATEGORIES = /* GraphQL */ `
   query Categorias {
      categories {
         id
         name
         description
      }
   }
`

export const QUERY_CATEGORY_BY_ID = /* GraphQL */ `
   query Categoria($id: ID!) {
      category(id: $id) {
         id
         name
         description
         products {
            id
            name
            description
            price
            stock
            img
         }
      }
   }
`

export const QUERY_PRODUCTS = /* GraphQL */ `
   query Productos($limit: Int, $offset: Int) {
      products(limit: $limit, offset: $offset) {
         id
         name
         description
         price
         stock
         img
         category {
            id
            name
         }
      }
   }
`

export const QUERY_PRODUCT_BY_ID = /* GraphQL */ `
   query Producto($id: ID!) {
      product(id: $id) {
         id
         name
         description
         price
         stock
         img
         category {
            id
            name
         }
      }
   }
`

const USER_FIELDS = /* GraphQL */ `
   fragment UserFields on User { id name tel email role }
`

const ORDER_FIELDS = /* GraphQL */ `
   fragment OrderFields on Order {
      id date total status
      client { id name }
      lines { id amount unitPrice product { id name } }
   }
`

export const QUERY_ME = /* GraphQL */ `
   query Yo { me { ...UserFields } }
   ${USER_FIELDS}
`
export const MUTATION_LOGIN = /* GraphQL */ `
   mutation IniciarSesion($data: LoginInput!) {
      login(data: $data) { token user { ...UserFields } }
   }
   ${USER_FIELDS}
`
export const MUTATION_REGISTER = /* GraphQL */ `
   mutation Registrar($data: RegisterInput!) {
      register(data: $data) { token user { ...UserFields } }
   }
   ${USER_FIELDS}
`

export const MUTATION_CREATE_ORDER = /* GraphQL */ `
   mutation CrearPedido($data: OrderInput!) {
      createOrder(data: $data) {
         ...OrderFields
      }
   }
`

export const QUERY_ORDERS = /* GraphQL */ `
   query Pedidos { orders { ...OrderFields } }
   ${ORDER_FIELDS}
`
export const QUERY_ORDER_BY_ID = /* GraphQL */ `
   query Pedido($id: ID!) { order(id: $id) { ...OrderFields } }
   ${ORDER_FIELDS}
`