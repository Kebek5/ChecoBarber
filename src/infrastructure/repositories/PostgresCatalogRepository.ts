import type { CatalogRepository } from '@/application/ports/CatalogRepository'
import type { Category } from '@/domain/catalog/Category'
import type { Product } from '@/domain/catalog/Product'
import { pool } from '@/infrastructure/db/pool'

type CategoryRow = {
  id: number
  nombre: string
  descripcion: string | null
}

type ProductRow = {
  id: number
  nombre: string
  descripcion: string | null
  precio: string | number
  stock: number
  imagen: string | null
  categoria_id: number
  categoria_nombre: string | null
}

// Un id que no es numérico no puede existir: se responde "no encontrado" sin consultar
const isValidId = (id: string): boolean => /^\d{1,9}$/.test(id)

// En la BD la imagen viene solo con el nombre del archivo (aceite-barba.jpg)
const toImageUrl = (img?: string | null): string => {
  if (!img) return ''
  if (/^(https?:)?\/\//.test(img) || img.startsWith('/')) return img
  return `/productos/${img}`
}

const toProduct = (row: ProductRow): Product => ({
  id: String(row.id),
  name: row.nombre,
  description: row.descripcion ?? '',
  price: Number(row.precio), // NUMERIC llega como texto desde pg
  stock: row.stock,
  img: toImageUrl(row.imagen),
  category: row.categoria_id
    ? { id: String(row.categoria_id), name: row.categoria_nombre ?? '' }
    : null,
})

const toCategory = (row: CategoryRow, products: Product[] = []): Category => ({
  id: String(row.id),
  name: row.nombre,
  description: row.descripcion ?? '',
  products,
})

const PRODUCT_SELECT = `
  SELECT p.*, c.nombre AS categoria_nombre
  FROM producto p
  LEFT JOIN categoria c ON c.id = p.categoria_id
`

export class PostgresCatalogRepository implements CatalogRepository {
  async listCategories(): Promise<Category[]> {
    const { rows } = await pool.query<CategoryRow>('SELECT * FROM categoria ORDER BY id')
    return rows.map((row) => toCategory(row))
  }

  async findCategoryById(id: string): Promise<Category | null> {
    if (!isValidId(id)) return null

    const { rows: categoryRows } = await pool.query<CategoryRow>(
      'SELECT * FROM categoria WHERE id = $1',
      [id]
    )
    if (!categoryRows[0]) return null

    const { rows: productRows } = await pool.query<ProductRow>(
      `${PRODUCT_SELECT} WHERE p.categoria_id = $1 ORDER BY p.id`,
      [id]
    )
    return toCategory(categoryRows[0], productRows.map(toProduct))
  }

  async listProducts(params: { limit?: number; offset?: number } = {}): Promise<Product[]> {
    let sql = `${PRODUCT_SELECT} ORDER BY p.id`
    const values: number[] = []

    if (params.limit != null) {
      values.push(Number(params.limit))
      sql += ` LIMIT $${values.length}`

      if (params.offset != null) {
        values.push(Number(params.offset))
        sql += ` OFFSET $${values.length}`
      }
    }

    const { rows } = await pool.query<ProductRow>(sql, values)
    return rows.map(toProduct)
  }

  async findProductById(id: string): Promise<Product | null> {
    if (!isValidId(id)) return null

    const { rows } = await pool.query<ProductRow>(`${PRODUCT_SELECT} WHERE p.id = $1`, [id])
    return rows[0] ? toProduct(rows[0]) : null
  }
}