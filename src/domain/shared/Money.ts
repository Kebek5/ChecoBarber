// Evita 0.1 + 0.2 = 0.30000000000000004. Lo usan Cart y Order.
export const roundMoney = (n: number): number => Math.round(n * 100) / 100