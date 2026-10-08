import { UnauthenticatedError } from '@/application/errors'
import type { AuthGateway, LoginData, RegisterData } from '@/application/ports/AuthGateway'
import type { Session, User } from '@/domain/auth/User'
import type { GraphqlClient } from '@/infrastructure/graphql/client'
import { MUTATION_LOGIN, MUTATION_REGISTER, QUERY_ME } from '@/infrastructure/graphql/queries'

type AuthPayload = { token: string; user: User }

export class GraphqlAuthGateway implements AuthGateway {
  constructor(private readonly gql: GraphqlClient) {}

  async login(data: LoginData): Promise<Session> {
    const res = await this.gql<{ login: AuthPayload }>(MUTATION_LOGIN, { data })
    return res.login
  }

  async register(data: RegisterData): Promise<Session> {
    const res = await this.gql<{ register: AuthPayload }>(MUTATION_REGISTER, { data })
    return res.register
  }

  async me(token: string): Promise<User> {
    const res = await this.gql<{ me: User | null }>(QUERY_ME, {}, { token })
    // Algunos backends devuelven me: null en vez de error cuando no hay sesión válida
    if (!res.me) throw new UnauthenticatedError('Sesión no válida.')
    return res.me
  }
}
