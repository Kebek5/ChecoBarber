// Siempre llama a /api/pagos/* (Astro), que reenvía al backend con el token de la sesión.

export class PaymentsApiError extends Error {
   constructor(
      message: string,
      readonly status: number
   ) {
      super(message)
      this.name = 'PaymentsApiError'
   }
}

async function request<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
   let response: Response
   try {
      response = await fetch(`/api/pagos/${path}`, {
         method,
         headers: body ? { 'Content-Type': 'application/json' } : undefined,
         body: body ? JSON.stringify(body) : undefined,
      })
   } catch {
      throw new PaymentsApiError('No se pudo conectar con el servidor.', 0)
   }

   const data = await response.json().catch(() => null)
   if (!response.ok) {
      throw new PaymentsApiError(data?.error ?? 'Ocurrió un error al procesar el pago.', response.status)
   }
   return data as T
}

export const paymentsApi = {
   get: <T>(path: string) => request<T>('GET', path),
   post: <T>(path: string, body: unknown) => request<T>('POST', path, body),
}