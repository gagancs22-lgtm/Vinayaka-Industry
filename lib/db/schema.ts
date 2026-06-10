// lib/db/schema.ts
import { pgTable, text, timestamp, integer, boolean, decimal, varchar, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ═══════════════════════════════════════════════════════════════════════════
// BETTER AUTH TABLES (Required - Do not modify)
// ═══════════════════════════════════════════════════════════════════════════

export const user = pgTable(
  'user',
  {
    id: text('id').primaryKey(),
    name: text('name'),
    email: text('email').notNull().unique(),
    emailVerified: boolean('emailVerified').notNull(),
    image: text('image'),
    createdAt: timestamp('createdAt').notNull(),
    updatedAt: timestamp('updatedAt').notNull(),
  }
)

export const session = pgTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expiresAt').notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('createdAt').notNull(),
    updatedAt: timestamp('updatedAt').notNull(),
    ipAddress: text('ipAddress'),
    userAgent: text('userAgent'),
    userId: text('userId')
      .notNull()
      .references(() => user.id),
  },
  (table) => ({
    userIdIdx: index('session_userId_idx').on(table.userId),
  })
)

export const account = pgTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('accountId').notNull(),
    providerId: text('providerId').notNull(),
    userId: text('userId')
      .notNull()
      .references(() => user.id),
    accessToken: text('accessToken'),
    refreshToken: text('refreshToken'),
    idToken: text('idToken'),
    accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
    refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('createdAt').notNull(),
    updatedAt: timestamp('updatedAt').notNull(),
  },
  (table) => ({
    userIdIdx: index('account_userId_idx').on(table.userId),
  })
)

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt'),
  updatedAt: timestamp('updatedAt'),
})

// ═══════════════════════════════════════════════════════════════════════════
// INVENTORY APP TABLES
// ═══════════════════════════════════════════════════════════════════════════

export const category = pgTable('category', {
  id: text('id').primaryKey().default(() => crypto.randomUUID()),
  name: varchar('name', { length: 255 }).notNull().unique(),
  description: text('description'),
  color: varchar('color', { length: 7 }),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
})

export const product = pgTable(
  'product',
  {
    id: text('id').primaryKey().default(() => crypto.randomUUID()),
    name: varchar('name', { length: 255 }).notNull(),
    sku: varchar('sku', { length: 100 }).notNull().unique(),
    barcode: varchar('barcode', { length: 100 }).unique(),
    description: text('description'),
    image: text('image'),
    categoryId: text('categoryId').notNull().references(() => category.id),
    unitType: varchar('unitType', { length: 50 }).notNull(),
    sellMethod: varchar('sellMethod', { length: 50 }).notNull().default('BY_QUANTITY'),
    status: varchar('status', { length: 50 }).notNull().default('ACTIVE'),
    minStock: integer('minStock').notNull().default(10),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
    updatedAt: timestamp('updatedAt').defaultNow().notNull(),
  },
  (table) => ({
    categoryIdIdx: index('product_categoryId_idx').on(table.categoryId),
    statusIdx: index('product_status_idx').on(table.status),
  })
)

export const productVariant = pgTable(
  'productVariant',
  {
    id: text('id').primaryKey().default(() => crypto.randomUUID()),
    productId: text('productId').notNull().references(() => product.id),
    name: varchar('name', { length: 255 }).notNull(),
    sku: varchar('sku', { length: 100 }).notNull().unique(),
    barcode: varchar('barcode', { length: 100 }).unique(),
    purchasePrice: decimal('purchasePrice', { precision: 10, scale: 2 }).notNull(),
    sellingPrice: decimal('sellingPrice', { precision: 10, scale: 2 }).notNull(),
    stock: integer('stock').notNull().default(0),
    minStock: integer('minStock').notNull().default(5),
    isDefault: boolean('isDefault').notNull().default(false),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
    updatedAt: timestamp('updatedAt').defaultNow().notNull(),
  },
  (table) => ({
    productIdIdx: index('productVariant_productId_idx').on(table.productId),
  })
)

export const bill = pgTable(
  'bill',
  {
    id: text('id').primaryKey().default(() => crypto.randomUUID()),
    invoiceNumber: varchar('invoiceNumber', { length: 50 }).notNull().unique(),
    billDate: timestamp('billDate').notNull().default(() => new Date()),
    customerName: varchar('customerName', { length: 255 }),
    customerPhone: varchar('customerPhone', { length: 20 }),
    status: varchar('status', { length: 50 }).notNull().default('PAID'),
    paymentMethod: varchar('paymentMethod', { length: 50 }).notNull().default('CASH'),
    subtotal: decimal('subtotal', { precision: 12, scale: 2 }).notNull(),
    discount: decimal('discount', { precision: 12, scale: 2 }).notNull().default('0'),
    discountType: varchar('discountType', { length: 20 }).notNull().default('FLAT'),
    tax: decimal('tax', { precision: 12, scale: 2 }).notNull().default('0'),
    taxPercent: decimal('taxPercent', { precision: 5, scale: 2 }).notNull().default('0'),
    totalAmount: decimal('totalAmount', { precision: 12, scale: 2 }).notNull(),
    amountPaid: decimal('amountPaid', { precision: 12, scale: 2 }).notNull(),
    change: decimal('change', { precision: 12, scale: 2 }).notNull().default('0'),
    notes: text('notes'),
    createdBy: text('createdBy').notNull().references(() => user.id),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
    updatedAt: timestamp('updatedAt').defaultNow().notNull(),
  },
  (table) => ({
    billDateIdx: index('bill_billDate_idx').on(table.billDate),
    createdByIdx: index('bill_createdBy_idx').on(table.createdBy),
    statusIdx: index('bill_status_idx').on(table.status),
  })
)

export const billItem = pgTable(
  'billItem',
  {
    id: text('id').primaryKey().default(() => crypto.randomUUID()),
    billId: text('billId').notNull().references(() => bill.id),
    variantId: text('variantId').notNull().references(() => productVariant.id),
    quantity: integer('quantity').notNull(),
    unitPrice: decimal('unitPrice', { precision: 10, scale: 2 }).notNull(),
    discount: decimal('discount', { precision: 10, scale: 2 }).notNull().default('0'),
    tax: decimal('tax', { precision: 10, scale: 2 }).notNull().default('0'),
    total: decimal('total', { precision: 12, scale: 2 }).notNull(),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
  },
  (table) => ({
    billIdIdx: index('billItem_billId_idx').on(table.billId),
    variantIdIdx: index('billItem_variantId_idx').on(table.variantId),
  })
)

export const purchase = pgTable(
  'purchase',
  {
    id: text('id').primaryKey().default(() => crypto.randomUUID()),
    purchaseNumber: varchar('purchaseNumber', { length: 50 }).notNull().unique(),
    supplierId: text('supplierId').notNull(),
    purchaseDate: timestamp('purchaseDate').notNull().default(() => new Date()),
    expectedDelivery: timestamp('expectedDelivery'),
    status: varchar('status', { length: 50 }).notNull().default('PENDING'),
    notes: text('notes'),
    createdBy: text('createdBy').notNull().references(() => user.id),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
    updatedAt: timestamp('updatedAt').defaultNow().notNull(),
  },
  (table) => ({
    createdByIdx: index('purchase_createdBy_idx').on(table.createdBy),
    statusIdx: index('purchase_status_idx').on(table.status),
  })
)

export const purchaseItem = pgTable(
  'purchaseItem',
  {
    id: text('id').primaryKey().default(() => crypto.randomUUID()),
    purchaseId: text('purchaseId').notNull().references(() => purchase.id),
    variantId: text('variantId').notNull().references(() => productVariant.id),
    quantity: integer('quantity').notNull(),
    unitPrice: decimal('unitPrice', { precision: 10, scale: 2 }).notNull(),
    total: decimal('total', { precision: 12, scale: 2 }).notNull(),
    receivedQuantity: integer('receivedQuantity').notNull().default(0),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
  },
  (table) => ({
    purchaseIdIdx: index('purchaseItem_purchaseId_idx').on(table.purchaseId),
    variantIdIdx: index('purchaseItem_variantId_idx').on(table.variantId),
  })
)

export const expense = pgTable(
  'expense',
  {
    id: text('id').primaryKey().default(() => crypto.randomUUID()),
    expenseNumber: varchar('expenseNumber', { length: 50 }).notNull().unique(),
    category: varchar('category', { length: 100 }).notNull(),
    amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
    description: text('description'),
    date: timestamp('date').notNull().default(() => new Date()),
    paymentMethod: varchar('paymentMethod', { length: 50 }).notNull(),
    status: varchar('status', { length: 50 }).notNull().default('APPROVED'),
    createdBy: text('createdBy').notNull().references(() => user.id),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
    updatedAt: timestamp('updatedAt').defaultNow().notNull(),
  },
  (table) => ({
    createdByIdx: index('expense_createdBy_idx').on(table.createdBy),
    dateIdx: index('expense_date_idx').on(table.date),
  })
)

export const auditLog = pgTable(
  'auditLog',
  {
    id: text('id').primaryKey().default(() => crypto.randomUUID()),
    userId: text('userId').notNull().references(() => user.id),
    action: varchar('action', { length: 100 }).notNull(),
    module: varchar('module', { length: 100 }).notNull(),
    entityId: text('entityId'),
    oldValue: text('oldValue'),
    newValue: text('newValue'),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('auditLog_userId_idx').on(table.userId),
    createdAtIdx: index('auditLog_createdAt_idx').on(table.createdAt),
  })
)

// ═══════════════════════════════════════════════════════════════════════════
// RELATIONS
// ═══════════════════════════════════════════════════════════════════════════

export const categoryRelations = relations(category, ({ many }) => ({
  products: many(product),
}))

export const productRelations = relations(product, ({ one, many }) => ({
  category: one(category, { fields: [product.categoryId], references: [category.id] }),
  variants: many(productVariant),
}))

export const productVariantRelations = relations(productVariant, ({ one, many }) => ({
  product: one(product, { fields: [productVariant.productId], references: [product.id] }),
  billItems: many(billItem),
  purchaseItems: many(purchaseItem),
}))

export const billRelations = relations(bill, ({ one, many }) => ({
  createdByUser: one(user, { fields: [bill.createdBy], references: [user.id] }),
  items: many(billItem),
}))

export const billItemRelations = relations(billItem, ({ one }) => ({
  bill: one(bill, { fields: [billItem.billId], references: [bill.id] }),
  variant: one(productVariant, { fields: [billItem.variantId], references: [productVariant.id] }),
}))

export const purchaseRelations = relations(purchase, ({ one, many }) => ({
  createdByUser: one(user, { fields: [purchase.createdBy], references: [user.id] }),
  items: many(purchaseItem),
}))

export const purchaseItemRelations = relations(purchaseItem, ({ one }) => ({
  purchase: one(purchase, { fields: [purchaseItem.purchaseId], references: [purchase.id] }),
  variant: one(productVariant, { fields: [purchaseItem.variantId], references: [productVariant.id] }),
}))

export const expenseRelations = relations(expense, ({ one }) => ({
  createdByUser: one(user, { fields: [expense.createdBy], references: [user.id] }),
}))

export const auditLogRelations = relations(auditLog, ({ one }) => ({
  user: one(user, { fields: [auditLog.userId], references: [user.id] }),
}))
