# Implementation Guide & API Reference

## Quick Start

```bash
# 1. Initialize project
npx create-next-app@latest inventory-system --typescript --tailwind --app
cd inventory-system

# 2. Install Shadcn UI
npx shadcn@latest init

# 3. Add required Shadcn components
npx shadcn@latest add button card dialog dropdown-menu form input label
npx shadcn@latest add popover select sheet sidebar switch table tabs toast
npx shadcn@latest add badge separator avatar scroll-area tooltip

# 4. Install remaining dependencies
npm install @prisma/client prisma jose bcryptjs
npm install pdfkit exceljs nodemailer cloudinary
npm install zustand swr recharts framer-motion
npm install react-hook-form zod @hookform/resolvers
npm install date-fns react-day-picker
npm install -D @types/bcryptjs @types/pdfkit @types/nodemailer tsx

# 5. Setup environment
cp .env.example .env.local
# Edit .env.local with your values

# 6. Initialize Prisma
npx prisma db push

# 7. Seed database
npm run db:seed

# 8. Run dev server
npm run dev
```

---

## API Routes Reference

### Authentication
| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/auth/login | Login with email/password |
| POST | /api/auth/logout | Clear auth cookie |
| POST | /api/auth/forgot-password | Send reset email |
| POST | /api/auth/reset-password | Reset with token |

### Products
| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/products | List with pagination/search |
| POST | /api/products | Create product + variants (ADMIN) |
| GET | /api/products/[id] | Get single product |
| PUT | /api/products/[id] | Update (tracks price history) |
| DELETE | /api/products/[id] | Soft delete (ADMIN) |
| GET | /api/products/[id]/price-history | Price change log |
| GET | /api/products/search?q= | Barcode/SKU/name search for POS |

### Categories
| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/categories | List all |
| POST | /api/categories | Create (ADMIN) |
| PUT | /api/categories/[id] | Update (ADMIN) |
| DELETE | /api/categories/[id] | Delete (ADMIN) |

### Suppliers
| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/suppliers | List |
| POST | /api/suppliers | Create |
| GET | /api/suppliers/[id] | Detail + purchase history |
| PUT | /api/suppliers/[id] | Update |

### Purchases
| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/purchases | List with filters |
| POST | /api/purchases | Create (auto-increments stock) |
| GET | /api/purchases/[id] | Detail |
| PUT | /api/purchases/[id] | Update |

### Inventory
| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/inventory | Current stock overview |
| GET | /api/inventory/movements | Stock movement log |
| POST | /api/inventory/adjust | Manual adjustment |
| GET | /api/inventory/low-stock | Low stock products |

### Billing (POS)
| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/billing | List bills |
| POST | /api/billing | Create bill (auto-decrements stock) |
| GET | /api/billing/[id] | Get bill detail |
| GET | /api/billing/[id]/pdf | Download PDF invoice |
| POST | /api/billing/[id]/email | Email invoice to customer |
| DELETE | /api/billing/[id] | Cancel bill (ADMIN) |

### Returns
| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/returns/sales | List sales returns |
| POST | /api/returns/sales | Create sales return |
| PUT | /api/returns/sales/[id]/approve | Approve (re-stocks) |
| GET | /api/returns/purchases | List purchase returns |
| POST | /api/returns/purchases | Create purchase return |
| PUT | /api/returns/purchases/[id]/approve | Approve (de-stocks) |

### Expenses
| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/expenses | List with filters |
| POST | /api/expenses | Add expense |
| PUT | /api/expenses/[id] | Update |
| DELETE | /api/expenses/[id] | Delete |

### Analytics
| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/analytics?type=dashboard | Summary cards |
| GET | /api/analytics?type=sales-trend&period=monthly | Sales chart data |
| GET | /api/analytics?type=top-products | Top selling products |
| GET | /api/analytics?type=inventory-trend | Stock in/out trend |

### Reports
| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/reports/sales | Sales report data |
| GET | /api/reports/inventory | Inventory report |
| GET | /api/reports/profit | Profit calculation |
| GET | /api/reports/export?type=sales&format=excel | Excel export |
| GET | /api/reports/export?type=sales&format=pdf | PDF export |

### Users (ADMIN only)
| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/users | List users |
| POST | /api/users | Create user |
| PUT | /api/users/[id] | Update |
| PUT | /api/users/[id]/status | Toggle active/inactive |

### Other
| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/notifications | Unread notifications |
| PUT | /api/notifications/read | Mark as read |
| GET | /api/audit-logs | Audit trail (ADMIN) |
| GET | /api/settings | Get settings |
| PUT | /api/settings | Update settings |

---

## Key Implementation Details

### Price Snapshot on Bills
Bills store `sellingPrice` at time of sale. When product prices change, old bills are never affected because `BillItem.sellingPrice` is a stored snapshot, not a foreign key reference.

### Stock Management Flow
```
Purchase Created → PurchaseItem records → Stock incremented → StockMovement logged
Bill Created    → BillItem records     → Stock decremented → StockMovement logged
Return Approved → ReturnItem records   → Stock adjusted    → StockMovement logged
```

### Invoice Number Generation
Uses atomic `settings.invoiceCounter` increment to prevent duplicates under concurrency. Format: `INV-2026-000001`.

### Role Guard Pattern for API Routes
```typescript
const userId = req.headers.get("x-user-id");   // set by middleware
const userRole = req.headers.get("x-user-role"); // set by middleware

if (userRole !== "ADMIN") {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
```

### Audit Logging Pattern
Every important action (price change, product delete, bill create, stock adjust) calls:
```typescript
await createAuditLog({
  userId,
  action: "PRODUCT_DELETED",
  module: "products",
  entityId: product.id,
  oldValue: product,
});
```

---

## Screens to Build

1. **Login** — Clean centered form, no sidebar
2. **Dashboard** — Summary cards grid + charts + notifications bell
3. **Products** — Table with image, variants count, stock status badge
4. **Product Form** — Multi-variant editor, image upload, price fields
5. **Categories** — Simple CRUD with color picker
6. **Billing/POS** — Left: product search grid. Right: cart + totals + payment
7. **Bills List** — Searchable table, quick PDF download
8. **Purchases** — Form to add supplier + line items
9. **Suppliers** — List + detail page with purchase history
10. **Inventory** — Stock table with movement log drawer
11. **Returns** — Sales/Purchase return forms with approval workflow
12. **Expenses** — Form + categorized list
13. **Reports** — Tabs for each report type, date picker, export buttons
14. **Analytics** — Charts dashboard with period controls
15. **Users** — Admin-only user management
16. **Audit Logs** — Read-only timeline
17. **Settings** — Business info + invoice config + theme

---

## Scalability Notes

- All list APIs are paginated (page + limit)
- Indexes on frequently queried fields (dates, categories, status)
- Stock movements table is an append-only audit trail — never delete records
- Price history is immutable — never update, only create new records
- Settings table has a single row (upsert pattern)
- Cloudinary handles image storage/CDN — not local disk
- MongoDB Atlas free tier supports up to 512MB; upgrade for production

## Future Add-ons (Architecture Ready)

- **Barcode Scanner**: `/api/products/search?barcode=` already exists
- **Multi-store**: Add `storeId` field to Products, Inventory, Bills
- **WhatsApp**: Replace email send in `/api/billing/[id]/email` with Twilio
- **AI Forecasting**: Feed StockMovement data to external ML endpoint
- **GST Filing**: Export bills data in GST JSON format via new report endpoint
