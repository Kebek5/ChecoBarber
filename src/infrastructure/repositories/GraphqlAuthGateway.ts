import type { AuthGateway } from '@/application/ports/AuthGateway'
import type { GraphqlClient } from '../graphql/client'
import type { AuthPayloadDTO, UserDTO } from '../graphql/dto'
import { MUTATION_LOGIN, MUTATION_REGISTER, QUERY_ME } from '../graphql/queries'
import { toSession, toUser } from '../graphql/mappers'

export class GraphqlAuthGateway implements AuthGateway {
   constructor(private readonly gql: GraphqlClient) {}

   async login(credentials: { email: string; password: string }) {
      const data = await this.gql<{ login: AuthPayloadDTO }>(MUTATION_LOGIN, { data: credentials })
      return toSession(data.login)
   }

   async register(registration: { name: string; tel: string; email: string; password: string }) {
      const data = await this.gql<{ register: AuthPayloadDTO }>(MUTATION_REGISTER, { data: registration })
      return toSession(data.register)
   }

   async me(token: string) {
      // Con token inválido el backend responde UNAUTHENTICATED y el cliente lanza
      // UnauthenticatedError; GetCurrentUser lo convierte en null.
      const data = await this.gql<{ me: UserDTO | null }>(QUERY_ME, {}, { token })
      return data.me ? toUser(data.me) : null
   }
}