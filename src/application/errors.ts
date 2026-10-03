export class UnauthenticatedError extends Error { name = 'UnauthenticatedError' }
export class ForbiddenError extends Error { name = 'ForbiddenError' }
export class InvalidInputError extends Error { name = 'InvalidInputError' }

export class BackendUnavailableError extends Error {
   name = 'BackendUnavailableError'
   constructor(message = 'No se pudo conectar con el servidor. Verifica que el backend esté corriendo.') {
      super(message)
   }
}