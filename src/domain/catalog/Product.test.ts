import { describe, it, expect } from 'vitest';
import { clampQuantity, matchesSearch } from './Product'

const product = { id: '1', name: 'Café Oscuro', description: '', price: 120,
   stock: 7, img: '', category: { id: '1', name: 'Café' } }

describe('Product', () => {
   it('limita la cantidad al stock', () => expect(clampQuantity(product, 999)).toBe(7))
   it('mínimo 1', () => expect(clampQuantity(product, 0)).toBe(1))
   it('0 si no hay stock', () => expect(clampQuantity({ ...product, stock: 0 }, 3)).toBe(0))
   it('ignora acentos', () => expect(matchesSearch(product, 'cafe')).toBe(true))
})