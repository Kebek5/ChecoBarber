import type { APIRoute } from 'astro'
import { endSession } from '@/infrastructure/auth/session'

export const POST: APIRoute = ({ cookies, redirect }) => {
  endSession(cookies)
  return redirect('/', 303)
}