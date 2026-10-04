// Lee primero import.meta.env (dev) y si no existe, process.env (producción con node)
const read = (key: string, fallback = ''): string =>
  (import.meta.env[key] as string | undefined) ?? process.env[key] ?? fallback

export const config = {
  authSecret: read('AUTH_SECRET'),
  db: {
    host: read('DB_HOST', 'localhost'),
    port: Number(read('DB_PORT', '5432')),
    user: read('DB_USER', 'postgres'),
    password: read('DB_PASSWORD'),
    name: read('DB_NAME', 'checobarber'),
  },
}