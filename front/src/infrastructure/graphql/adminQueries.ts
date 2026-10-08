const ORDER_FIELDS = /* GraphQL */ `
   fragment AdminOrderFields on Order {
      id date total status
      client { id name email tel }
      lines { id amount unitPrice product { id name } }
   }
`

export const QUERY_ADMIN_ORDERS = /* GraphQL */ `
   query PedidosAdmin { orders { ...AdminOrderFields } }
   ${ORDER_FIELDS}
`

export const QUERY_ADMIN_ORDER_BY_ID = /* GraphQL */ `
   query PedidoAdmin($id: ID!) { order(id: $id) { ...AdminOrderFields } }
   ${ORDER_FIELDS}
`

export const MUTATION_UPDATE_ORDER_STATUS = /* GraphQL */ `
   mutation ActualizarPedido($id: ID!, $status: OrderStatus!) {
      updateOrderStatus(id: $id, status: $status) { ...AdminOrderFields }
   }
   ${ORDER_FIELDS}
`

const APPOINTMENT_FIELDS = /* GraphQL */ `
   fragment AdminAppointmentFields on Appointment {
      id date hour state price
      client { id name tel }
      service { id name duration }
   }
`

export const QUERY_ADMIN_APPOINTMENTS = /* GraphQL */ `
   query CitasAdmin { appointments { ...AdminAppointmentFields } }
   ${APPOINTMENT_FIELDS}
`

export const MUTATION_UPDATE_APPOINTMENT_STATUS = /* GraphQL */ `
   mutation ActualizarCita($id: ID!, $status: AppointmentStatus!) {
      updateAppointmentStatus(id: $id, status: $status) { ...AdminAppointmentFields }
   }
   ${APPOINTMENT_FIELDS}
`

export const QUERY_ADMIN_USERS = /* GraphQL */ `
   query UsuariosAdmin { users { id name tel email role } }
`

const PRODUCT_FIELDS = `id name description price stock img category { id name }`

export const MUTATION_CREATE_PRODUCT = /* GraphQL */ `
   mutation CrearProducto($data: ProductInput!) {
      createProduct(data: $data) { ${PRODUCT_FIELDS} }
   }
`

export const MUTATION_UPDATE_PRODUCT = /* GraphQL */ `
   mutation ActualizarProducto($id: ID!, $data: ProductInput!) {
      updateProduct(id: $id, data: $data) { ${PRODUCT_FIELDS} }
   }
`

export const MUTATION_DELETE_PRODUCT = /* GraphQL */ `
   mutation EliminarProducto($id: ID!) { deleteProduct(id: $id) }
`