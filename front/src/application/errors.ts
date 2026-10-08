export class AppError extends Error {
  name = 'AppError'
}

export class UnauthenticatedError extends AppError {
  name = 'UnauthenticatedError'
}

export class ForbiddenError extends AppError {
  name = 'ForbiddenError'
}

export class InvalidInputError extends AppError {
  name = 'InvalidInputError'
}

export class BackendUnavailableError extends AppError {
  name = 'BackendUnavailableError'

  constructor(message = 'No se pudo conectar con el servidor. Intenta de nuevo en un momento.') {
    super(message)
  }
}
