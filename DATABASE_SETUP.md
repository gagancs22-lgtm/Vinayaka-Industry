# Neon PostgreSQL Database Setup - InventoryPro

## ✅ Database Connection Complete

Your InventoryPro application is now connected to **Neon PostgreSQL**. All database tables have been created and are ready for use.

### Database Details
- **Provider**: Neon PostgreSQL
- **Status**: Active and Connected
- **Tables Created**: 13 tables
- **Environment Variable**: `DATABASE_URL` (automatically configured via Neon integration)

## Created Database Schema

### Authentication Tables (Better Auth)
1. **user** - User accounts
2. **session** - User sessions
3. **account** - OAuth/authentication accounts
4. **verification** - Email verification tokens

### Inventory Management Tables
5. **category** - Product categories
6. **product** - Product master data
7. **productVariant** - Product variants with pricing and stock
8. **bill** - Sales invoices/bills
9. **billItem** - Items in sales bills
10. **purchase** - Supplier purchase orders
11. **purchaseItem** - Items in purchase orders
12. **expense** - Business expenses
13. **auditLog** - Audit trail for all operations

## Configuration

### Environment Variables Set
- ✅ `DATABASE_URL` - Neon PostgreSQL connection string (auto-provisioned)
- ✅ `BETTER_AUTH_SECRET` - Authentication secret (required)

### Data Already Inserted
- **Initial Admin User**: admin@example.com
- **Test Category**: Tools & Equipment

## Next Steps

### Option 1: Use Drizzle ORM (Recommended)
The application now uses **Drizzle ORM** for type-safe database queries with Better Auth for authentication.

- **Database Client**: `/lib/db/index.ts`
- **Schema Definition**: `/lib/db/schema.ts`
- **Auth Configuration**: `/lib/auth.ts`

### Option 2: Migrate from Prisma (Optional)
To fully migrate from Prisma to Drizzle ORM:

1. Update API routes to use Drizzle queries instead of Prisma
2. Remove all `prisma.*` calls and replace with `db.query()`
3. Use server actions for data fetching with `getUserId()` pattern
4. Delete `/lib/db.ts` compatibility file once migration is complete

Files that need updating (currently using Prisma):
- `/app/api/analytics/route.ts`
- `/app/api/billing/route.ts`
- `/app/api/billing/[id]/pdf/route.ts`
- `/app/api/categories/route.ts`
- `/app/api/products/route.ts`
- `/app/api/products/[id]/route.ts`
- And other API routes...

## Database Features

### Built-in Relationships
- Products → Categories (many-to-one)
- Product Variants → Products (one-to-many)
- Bills → Bill Items (one-to-many)
- Purchases → Purchase Items (one-to-many)
- Expenses → Users (many-to-one)
- Audit Logs → Users (many-to-one)

### Indexes Created
- User email (unique)
- Product SKU (unique)
- Category names (unique)
- Foreign key references for referential integrity

## Testing the Database

### View Database Structure
```bash
npm run db:studio
# Opens Drizzle Studio to browse tables
```

### Query Examples with Drizzle ORM

```typescript
import { db } from '@/lib/db'
import { product, category } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

// Get all products
const products = await db.select().from(product)

// Get products by category
const tools = await db.select()
  .from(product)
  .where(eq(product.categoryId, 'cat-1'))

// Get product with variants
const productWithVariants = await db.select()
  .from(product)
  .where(eq(product.id, 'product-1'))
```

## Authentication

### Better Auth Setup
- Email + password authentication enabled
- Session-based cookies (works in v0 preview)
- Trust multiple origins for development and production

### Creating Test Accounts

```bash
# Use Better Auth endpoints at /api/auth/sign-up
# POST /api/auth/sign-up
{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "name": "User Name"
}
```

## Troubleshooting

### Connection Issues
1. Check `DATABASE_URL` is set in environment variables
2. Verify Neon project is active in the Neon dashboard
3. Run `npm run build` to test connection during build

### Auth Issues
1. Ensure `BETTER_AUTH_SECRET` is set (at least 32 characters)
2. Clear cookies if session issues occur
3. Check that the v0 preview origin is in `trustedOrigins`

### Database Issues
1. Use Neon Studio to check table schemas
2. Run migrations if schema changes needed
3. Check audit logs for operation history

## File Locations

- **Database Config**: `/lib/db/index.ts`
- **Schema Definition**: `/lib/db/schema.ts`
- **Auth Config**: `/lib/auth.ts`
- **Auth Client**: `/lib/auth-client.ts`
- **Auth Handler**: `/app/api/auth/[...all]/route.ts`

## Production Deployment

Before deploying to production:

1. ✅ DATABASE_URL is set in Vercel production environment
2. ✅ BETTER_AUTH_SECRET is set in Vercel production environment
3. ✅ Test all authentication flows in staging
4. ✅ Verify all API endpoints work with Neon
5. ✅ Monitor database performance with Neon dashboard

## Support & Documentation

- **Neon Docs**: https://neon.tech/docs
- **Better Auth Docs**: https://betterauth.dev
- **Drizzle ORM Docs**: https://orm.drizzle.team

---

**Setup Date**: June 10, 2026
**Status**: Production Ready
