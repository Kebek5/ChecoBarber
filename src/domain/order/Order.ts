import type { User } from '../auth/User';
import type { CartItem } from '../cart/CartItem';
import { roundMoney } from "../shared/Money";

export type OrderId = string;
export type OrderStatus = 'PENDING' | 'IN_PROCESS' | 'COMPLETED';

export interface OrderLine {
   readonly id: string
   readonly productId: string
   readonly productName: string
   readonly quantity: number
   readonly unitPrice: number
}

export interface Order {
   readonly id: OrderId;
   readonly date: string;
   readonly total: number;
   readonly status: OrderStatus;
   readonly customer: Pick<User, 'id' | 'name'>;
   readonly lines: OrderLine[];
}


export interface OrderRequestLine {
   readonly productId: string
   readonly quantity: number
}

export interface OrderRequest {
   readonly lines: readonly OrderRequestLine[]
}

export class EmptyOrderError extends Error {
   constructor() {
      super('El pedido debe tener al menos un producto.')
      this.name = 'EmptyOrderError'
   }
}

export const lineSubtotal = (line: OrderLine): number => roundMoney(line.quantity * line.unitPrice);

export const calculateTotal = (lines: readonly OrderLine[]): number => 
   roundMoney(lines.reduce((sum, line) => sum + lineSubtotal(line), 0));

// domain/order/Order.ts
export function assertValidOrderRequest(request: OrderRequest): void {
   if (request.lines.length === 0) throw new EmptyOrderError()
   if (request.lines.some((l) => !Number.isInteger(l.quantity) || l.quantity < 1))
      throw new Error('Todas las cantidades deben ser enteros mayores o iguales a 1.')
}

export function createOrderRequest(items: readonly CartItem[]): OrderRequest {
   const request = {
      lines: items.map(({ productId, quantity }) => ({ productId, quantity })),
   }
   assertValidOrderRequest(request)
   return request
}