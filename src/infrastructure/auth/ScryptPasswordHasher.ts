import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import type { PasswordHasher } from '@/application/ports/PasswordHasher'

const PREFIX = 'scrypt$'

const derive = (password: string, salt: Buffer, keylen: number) =>
  new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, keylen, (err, key) => (err ? reject(err) : resolve(key)))
  })

export class ScryptPasswordHasher implements PasswordHasher {
  async hash(password: string): Promise<string> {
    const salt = randomBytes(16)
    const key = await derive(password, salt, 64)
    return `${PREFIX}${salt.toString('hex')}$${key.toString('hex')}`
  }

  async verify(password: string, stored: string): Promise<boolean> {
    // Contraseñas viejas guardadas en texto plano (las de db.sql)
    if (!stored.startsWith(PREFIX)) {
      const a = Buffer.from(password)
      const b = Buffer.from(stored)
      return a.length === b.length && timingSafeEqual(a, b)
    }

    const [, saltHex, keyHex] = stored.split('$')
    if (!saltHex || !keyHex) return false

    const expected = Buffer.from(keyHex, 'hex')
    const key = await derive(password, Buffer.from(saltHex, 'hex'), expected.length)
    return timingSafeEqual(key, expected)
  }

  needsRehash(stored: string): boolean {
    return !stored.startsWith(PREFIX)
  }
}