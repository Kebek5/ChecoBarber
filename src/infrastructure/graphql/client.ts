import {
  BackendUnavailableError,
  ForbiddenError,
  InvalidInputError,
  UnauthenticatedError,
} from '@/application/errors'

export type GraphqlClient = <T = unknown>(
  query: string,
  variables?: Record<string, unknown>,
  options?: { token?: string }
) => Promise<T>

const ERROR_BY_CODE: Record<string, new (message?: string) => Error> = {
  UNAUTHENTICATED: UnauthenticatedError,
  FORBIDDEN: ForbiddenError,
  BAD_USER_INPUT: InvalidInputError,
}

const TIMEOUT_MS = 10_000

export function createGraphqlClient(endpoint: string): GraphqlClient {
  return async <T>(query: string, variables = {}, { token }: { token?: string } = {}) => {
    let response: Response

    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // El backend (src/auth.js) exige exactamente "Bearer <token>"
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ query, variables }),
        // El middleware consulta "me" en cada petición: un backend colgado no debe colgar la tienda
        signal: AbortSignal.timeout(TIMEOUT_MS),
      })
    } catch {
      throw new BackendUnavailableError()
    }

    const payload = await response.json().catch(() => null)

    const first = payload?.errors?.[0]
    if (first) {
      const ErrorClass = ERROR_BY_CODE[first.extensions?.code] ?? Error
      throw new ErrorClass(first.message || 'El servidor respondió con un error.')
    }
    if (!response.ok || !payload) {
      throw new Error(`El servidor respondió con un error (${response.status}).`)
    }

    return payload.data as T
  }
}
