import type {
  NewUserRecord,
  StoredUser,
  UserRepository,
} from '@/application/ports/UserRepository'
import type { User } from '@/domain/auth/User'
import { pool } from '@/infrastructure/db/pool'

type UserRow = {
  id: number
  nombre: string
  telefono: string
  correo: string
  contrasena: string
  rol: 'cliente' | 'admin'
}

const toStoredUser = (row: UserRow): StoredUser => ({
  id: String(row.id),
  name: row.nombre,
  tel: row.telefono,
  email: row.correo,
  role: row.rol === 'admin' ? 'ADMIN' : 'CLIENT',
  passwordHash: row.contrasena,
})

export class PostgresUserRepository implements UserRepository {
  async findByEmail(email: string): Promise<StoredUser | null> {
    const { rows } = await pool.query<UserRow>(
      'SELECT * FROM usuario WHERE correo = $1 LIMIT 1',
      [email]
    )
    return rows[0] ? toStoredUser(rows[0]) : null
  }

  // El rol siempre es "cliente": un admin solo se crea directo en la BD
  async create(data: NewUserRecord): Promise<User> {
    try {
      const { rows } = await pool.query<{ id: number }>(
        `INSERT INTO usuario (nombre, telefono, correo, contrasena, rol)
         VALUES ($1, $2, $3, $4, 'cliente')
         RETURNING id`,
        [data.name, data.tel, data.email, data.passwordHash]
      )
      return {
        id: String(rows[0].id),
        name: data.name,
        tel: data.tel,
        email: data.email,
        role: 'CLIENT',
      }
    } catch (err) {
      // 23505 = unique_violation (correo repetido)
      if ((err as { code?: string }).code === '23505') {
        throw new Error('Ya existe una cuenta con ese correo.')
      }
      throw err
    }
  }

  async updatePasswordHash(id: string, passwordHash: string): Promise<void> {
    await pool.query('UPDATE usuario SET contrasena = $1 WHERE id = $2', [passwordHash, id])
  }
}