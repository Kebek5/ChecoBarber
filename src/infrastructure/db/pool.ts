import pg from 'pg'
import { config } from '@/infrastructure/config'

export const pool = new pg.Pool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.name,
  max: 10,
})

// Sin esto, una conexión inactiva que se cae tumba todo el servidor
pool.on('error', (err) => {
  console.error('Error en una conexión inactiva de PostgreSQL:', err.message)
})