import type { OrderGateway } from '@/application/ports/OrderGateway'
import type { Order, OrderConfirmation } from '@/domain/order/Order'
import { pool } from '@/infrastructure/db/pool'

type StockRow = {
  id: number
  nombre: string
  precio: string | number
  stock: number
}

type OrderRow = {
  id: number
  fecha: string
  total: string | number
  estado: string
}

const STATUS: Record<string, string> = {
  pendiente: 'PENDING',
  en_proceso: 'IN_PROCESS',
  realizado: 'COMPLETED',
}

export class PostgresOrderGateway implements OrderGateway {
  async place(order: Order): Promise<OrderConfirmation> {
    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      const { rows: created } = await client.query<{ id: number }>(
        `INSERT INTO pedido (fecha, total, estado, cliente_id)
         VALUES (CURRENT_DATE, 0, 'pendiente', $1)
         RETURNING id`,
        [order.customer.id]
      )
      const orderId = created[0].id

      let total = 0

      for (const line of order.lines) {
        if (!/^\d{1,9}$/.test(line.productId)) {
          throw new Error(`Producto ${line.productId} no existe.`)
        }

        // FOR UPDATE bloquea el producto para que dos compras no vendan el mismo stock
        const { rows } = await client.query<StockRow>(
          'SELECT id, nombre, precio, stock FROM producto WHERE id = $1 FOR UPDATE',
          [line.productId]
        )
        const product = rows[0]

        if (!product) throw new Error(`Producto ${line.productId} no existe.`)
        if (product.stock < line.amount) {
          throw new Error(`Stock insuficiente para "${product.nombre}".`)
        }

        const unitPrice = Number(product.precio)
        total += unitPrice * line.amount

        await client.query(
          `INSERT INTO detalle_pedido (cantidad, precio_unitario, pedido_id, producto_id)
           VALUES ($1, $2, $3, $4)`,
          [line.amount, unitPrice, orderId, product.id]
        )
        await client.query('UPDATE producto SET stock = stock - $1 WHERE id = $2', [
          line.amount,
          product.id,
        ])
      }

      total = Math.round(total * 100) / 100
      await client.query('UPDATE pedido SET total = $1 WHERE id = $2', [total, orderId])

      const { rows: orderRows } = await client.query<OrderRow>(
        `SELECT id, to_char(fecha, 'YYYY-MM-DD') AS fecha, total, estado
         FROM pedido WHERE id = $1`,
        [orderId]
      )
      await client.query('COMMIT')

      const saved = orderRows[0]
      return {
        id: String(saved.id),
        date: saved.fecha,
        total: Number(saved.total),
        status: STATUS[saved.estado] ?? 'PENDING',
      }
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {})
      throw err
    } finally {
      client.release()
    }
  }
}