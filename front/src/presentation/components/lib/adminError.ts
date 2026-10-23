import { AppError } from '@/application/errors'

// Solo mostramos mensajes pensados para el usuario; el resto va genérico
export const toMessage = (err: unknown, fallback: string) =>
   err instanceof AppError ? err.message : fallback