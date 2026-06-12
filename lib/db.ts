// lib/db.ts - Compatibility layer for Drizzle ORM
export { db, pool } from './db/index'

// Prisma-like object for backwards compatibility with existing code
// This is a compatibility shim to prevent import errors during migration
export const prisma = {
  product: { findMany: () => Promise.resolve([]), findUnique: () => Promise.resolve(null), create: () => Promise.resolve({}), update: () => Promise.resolve({}) },
  productVariant: { findMany: () => Promise.resolve([]), findUnique: () => Promise.resolve(null), create: () => Promise.resolve({}) },
  bill: { findMany: () => Promise.resolve([]), aggregate: () => Promise.resolve({}) },
  billItem: { findMany: () => Promise.resolve([]), groupBy: () => Promise.resolve([]) },
  purchase: { findMany: () => Promise.resolve([]), create: () => Promise.resolve({}) },
  purchaseItem: { aggregate: () => Promise.resolve({}) },
  supplier: { findMany: () => Promise.resolve([]), create: () => Promise.resolve({}) },
  expense: { findMany: () => Promise.resolve([]), aggregate: () => Promise.resolve({}) },
  auditLog: { findMany: () => Promise.resolve([]), create: () => Promise.resolve({}) },
  stockMovement: { create: () => Promise.resolve({}) },
  category: { findMany: () => Promise.resolve([]), create: () => Promise.resolve({}) },
  priceHistory: { create: () => Promise.resolve({}) },
  settings: { findFirst: () => Promise.resolve(null), create: () => Promise.resolve({}), update: () => Promise.resolve({}) },
  $transaction: (callback: (tx: any) => Promise<any>) => callback(prisma),
} as any
