# Inventory Management System — Complete Architecture

## Tech Stack
- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, Shadcn UI, Framer Motion, Recharts
- **Backend**: Next.js API Routes + Server Actions
- **Database**: MongoDB Atlas + Prisma ORM
- **Auth**: JWT + HttpOnly Cookies + RBAC
- **Storage**: Cloudinary
- **PDF**: PDFKit
- **Export**: ExcelJS
- **Deploy**: Vercel

---

## Folder Structure

```
inventory-system/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   └── reset-password/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx                    # Sidebar + Header wrapper
│   │   ├── page.tsx                      # Dashboard home
│   │   ├── products/
│   │   │   ├── page.tsx                  # Products list
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── categories/page.tsx
│   │   ├── inventory/
│   │   │   ├── page.tsx                  # Stock overview
│   │   │   └── movements/page.tsx
│   │   ├── purchases/
│   │   │   ├── page.tsx
│   │   │   └── new/page.tsx
│   │   ├── suppliers/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── billing/
│   │   │   ├── page.tsx                  # POS interface
│   │   │   └── [id]/page.tsx             # Invoice view
│   │   ├── returns/
│   │   │   ├── sales/page.tsx
│   │   │   └── purchases/page.tsx
│   │   ├── expenses/page.tsx
│   │   ├── reports/
│   │   │   ├── sales/page.tsx
│   │   │   ├── inventory/page.tsx
│   │   │   ├── purchases/page.tsx
│   │   │   ├── expenses/page.tsx
│   │   │   └── profit/page.tsx
│   │   ├── analytics/page.tsx
│   │   ├── users/page.tsx                # Admin only
│   │   ├── audit-logs/page.tsx           # Admin only
│   │   └── settings/page.tsx
│   └── api/
│       ├── auth/
│       │   ├── login/route.ts
│       │   ├── logout/route.ts
│       │   ├── forgot-password/route.ts
│       │   └── reset-password/route.ts
│       ├── products/
│       │   ├── route.ts                  # GET (list), POST (create)
│       │   └── [id]/route.ts             # GET, PUT, DELETE
│       ├── categories/route.ts
│       ├── suppliers/route.ts
│       ├── purchases/route.ts
│       ├── inventory/
│       │   ├── route.ts
│       │   └── movements/route.ts
│       ├── billing/
│       │   ├── route.ts
│       │   └── [id]/
│       │       ├── route.ts
│       │       └── pdf/route.ts
│       ├── returns/
│       │   ├── sales/route.ts
│       │   └── purchases/route.ts
│       ├── expenses/route.ts
│       ├── reports/
│       │   ├── sales/route.ts
│       │   ├── inventory/route.ts
│       │   ├── profit/route.ts
│       │   └── export/route.ts
│       ├── analytics/route.ts
│       ├── users/route.ts
│       ├── audit-logs/route.ts
│       ├── notifications/route.ts
│       └── settings/route.ts
├── components/
│   ├── ui/                               # Shadcn primitives
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   ├── MobileNav.tsx
│   │   └── ThemeToggle.tsx
│   ├── dashboard/
│   │   ├── SummaryCard.tsx
│   │   ├── SalesTrendChart.tsx
│   │   ├── InventoryTrendChart.tsx
│   │   ├── TopProductsTable.tsx
│   │   └── NotificationBell.tsx
│   ├── products/
│   │   ├── ProductForm.tsx
│   │   ├── ProductTable.tsx
│   │   ├── VariantManager.tsx
│   │   └── PriceHistoryDrawer.tsx
│   ├── billing/
│   │   ├── POSInterface.tsx
│   │   ├── CartPanel.tsx
│   │   ├── ProductSearch.tsx
│   │   └── InvoicePrint.tsx
│   ├── inventory/
│   │   ├── StockTable.tsx
│   │   └── MovementsLog.tsx
│   ├── reports/
│   │   ├── DateRangePicker.tsx
│   │   ├── ExportButton.tsx
│   │   └── ReportChart.tsx
│   └── shared/
│       ├── DataTable.tsx
│       ├── ConfirmDialog.tsx
│       ├── ImageUpload.tsx
│       ├── PageHeader.tsx
│       ├── StatusBadge.tsx
│       └── EmptyState.tsx
├── lib/
│   ├── db.ts                             # Prisma client singleton
│   ├── auth.ts                           # JWT helpers
│   ├── cloudinary.ts
│   ├── pdf.ts                            # PDFKit helpers
│   ├── excel.ts                          # ExcelJS helpers
│   ├── invoice.ts                        # Invoice number generator
│   ├── audit.ts                          # Audit log writer
│   └── notifications.ts                  # Alert checker
├── hooks/
│   ├── useAuth.ts
│   ├── useProducts.ts
│   ├── useBilling.ts
│   └── useNotifications.ts
├── store/
│   └── billingStore.ts                   # Zustand POS cart state
├── types/
│   └── index.ts                          # Shared TypeScript types
├── middleware.ts                          # Route protection
├── prisma/
│   └── schema.prisma
└── public/
```

---

## Data Flow

```
Client → Middleware (JWT verify) → API Route → Prisma → MongoDB Atlas
                                      ↓
                              Audit Log Writer
                              Notification Checker
```
