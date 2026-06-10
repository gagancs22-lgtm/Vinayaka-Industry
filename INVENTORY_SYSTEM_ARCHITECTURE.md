# Steel & Roofing Products Inventory System - Architecture Documentation

## Overview

This is a professional-grade inventory management system designed for large-scale steel, roofing products, GI pipes, wires, and structural materials businesses.

**Key Design Principle**: Hierarchical product structure to efficiently manage 10,000+ products with 100,000+ transactions.

---

## Database Schema Architecture

### Core Tables

#### 1. Category
Top-level product categories representing product families.

**Examples**: Tube, Roofing Sheet, GI Pipe, Wire, Structural Steel, Hardware

```
category
├── id (TEXT PRIMARY KEY)
├── name (VARCHAR 255, UNIQUE)
├── description (TEXT)
├── color (VARCHAR 7)
└── timestamps
```

#### 2. Product Group
Mid-level grouping under categories, representing product brands or types.

**Examples**:
- Category: Tube
  - Product Groups: GT Tube, GI Tube, MS Tube
- Category: Roofing Sheet
  - Product Groups: Tata Bluescope, JSW Sheet, Colour Sheet

```
productGroup
├── id (TEXT PRIMARY KEY)
├── name (VARCHAR 255, UNIQUE per category)
├── categoryId (FOREIGN KEY → category)
├── description (TEXT)
├── image (TEXT - URL)
└── timestamps
```

#### 3. Product Variant
Individual SKU-level products with stock, pricing, and dimensions.

**Examples**:
- GT Tube Variants:
  - 60x40 1.4mm, 60x40 1.8mm, 80x40 1.4mm, etc.
- Tata Bluescope Variants:
  - 0.47mm 6F, 0.47mm 8F, 0.47mm 10F, etc.

```
productVariant
├── id (TEXT PRIMARY KEY)
├── productGroupId (FOREIGN KEY → productGroup)
├── name (VARCHAR 255)
├── sku (VARCHAR 100, UNIQUE)
├── barcode (VARCHAR 100, UNIQUE)
├── dimensions
│   ├── thickness (VARCHAR 50)
│   ├── length (VARCHAR 50)
│   ├── width (VARCHAR 50)
│   └── weight (DECIMAL 10,2)
├── pricing (multiple tiers)
│   ├── purchasePrice (DECIMAL 10,2)
│   ├── dealerPrice (DECIMAL 10,2)
│   ├── wholesalePrice (DECIMAL 10,2)
│   └── retailPrice (DECIMAL 10,2)
├── inventory
│   ├── stock (INTEGER)
│   └── minStock (INTEGER)
├── status (ACTIVE/INACTIVE)
└── timestamps
```

---

## Inventory Management Tables

### Stock Movement Tracking
All inventory changes are tracked for audit trail and analytics.

```
stockMovement
├── id (TEXT PRIMARY KEY)
├── variantId (FOREIGN KEY → productVariant)
├── type (PURCHASE, SALE, ADJUSTMENT, RETURN)
├── quantity (INTEGER)
├── reason (TEXT)
├── referenceId (links to bill/purchase/adjustment)
├── createdBy (FOREIGN KEY → user)
└── createdAt (TIMESTAMP)
```

### Price History
Track all price changes for compliance and historical invoicing.

```
priceHistory
├── id (TEXT PRIMARY KEY)
├── productGroupId (FOREIGN KEY)
├── variantId (FOREIGN KEY)
├── priceType (PURCHASE/DEALER/WHOLESALE/RETAIL)
├── oldPrice (DECIMAL)
├── newPrice (DECIMAL)
├── changedBy (FOREIGN KEY → user)
└── changedAt (TIMESTAMP)
```

---

## Business Partner Tables

### Supplier Management
```
supplier
├── id (TEXT PRIMARY KEY)
├── name (VARCHAR 255, UNIQUE)
├── email (VARCHAR 255)
├── phone (VARCHAR 20)
├── address (TEXT)
├── city (VARCHAR 100)
├── state (VARCHAR 100)
└── timestamps

supplierLedger
├── id (TEXT PRIMARY KEY)
├── supplierId (FOREIGN KEY → supplier)
├── purchaseAmount (DECIMAL 12,2)
├── paidAmount (DECIMAL 12,2)
├── outstandingAmount (DECIMAL 12,2)
├── paymentDate (TIMESTAMP)
├── notes (TEXT)
└── timestamps
```

### Customer Management
```
customer
├── id (TEXT PRIMARY KEY)
├── name (VARCHAR 255)
├── email (VARCHAR 255)
├── phone (VARCHAR 20)
├── customerType (RETAIL/WHOLESALE/DEALER)
├── address (TEXT)
├── city (VARCHAR 100)
├── state (VARCHAR 100)
└── timestamps

customerLedger
├── id (TEXT PRIMARY KEY)
├── customerId (FOREIGN KEY → customer)
├── totalPurchases (DECIMAL 12,2)
├── paidAmount (DECIMAL 12,2)
├── outstandingAmount (DECIMAL 12,2)
├── lastPaymentDate (TIMESTAMP)
└── timestamps
```

---

## Transaction Tables

### Billing System
```
bill
├── id (TEXT PRIMARY KEY)
├── invoiceNumber (VARCHAR 50, UNIQUE)
├── billDate (TIMESTAMP)
├── customerId (FOREIGN KEY - optional for walk-in)
├── status (PAID/PENDING/PARTIAL)
├── paymentMethod (CASH/CARD/CHECK/TRANSFER)
├── subtotal (DECIMAL 12,2)
├── discount (DECIMAL 12,2)
├── tax (DECIMAL 12,2)
├── totalAmount (DECIMAL 12,2)
├── amountPaid (DECIMAL 12,2)
├── createdBy (FOREIGN KEY → user)
└── timestamps

billItem
├── id (TEXT PRIMARY KEY)
├── billId (FOREIGN KEY → bill)
├── variantId (FOREIGN KEY → productVariant)
├── quantity (INTEGER)
├── unitPrice (DECIMAL 10,2) - historical price
├── discount (DECIMAL 10,2)
├── tax (DECIMAL 10,2)
├── total (DECIMAL 12,2)
└── createdAt
```

### Purchase Orders
```
purchase
├── id (TEXT PRIMARY KEY)
├── purchaseNumber (VARCHAR 50, UNIQUE)
├── supplierId (FOREIGN KEY → supplier)
├── purchaseDate (TIMESTAMP)
├── expectedDelivery (TIMESTAMP)
├── status (PENDING/RECEIVED/PARTIAL)
├── createdBy (FOREIGN KEY → user)
└── timestamps

purchaseItem
├── id (TEXT PRIMARY KEY)
├── purchaseId (FOREIGN KEY → purchase)
├── variantId (FOREIGN KEY → productVariant)
├── quantity (INTEGER - ordered)
├── unitPrice (DECIMAL 10,2)
├── total (DECIMAL 12,2)
├── receivedQuantity (INTEGER)
└── createdAt
```

---

## Key Features & Implementation

### 1. Hierarchical Product Structure
- **Category** → High-level product family (Tube, Roofing Sheet)
- **Product Group** → Brand/type within category (GT Tube, Tata Bluescope)
- **Variant** → Specific SKU with dimensions and pricing

**Benefit**: 10,000 steel products can be managed efficiently without creating 10,000 separate "products"

### 2. Multiple Pricing Tiers
Each variant supports 4 price levels:
- **Purchase Price**: Cost from supplier
- **Dealer Price**: Wholesale/dealer rates
- **Wholesale Price**: Bulk purchase rate
- **Retail Price**: Standard retail rate

**Implementation**: When creating a bill, select customer type and pricing automatically applies

### 3. Automatic SKU Generation
SKU Format: `[GROUP_CODE]-[DIMENSION1]-[DIMENSION2]`

**Examples**:
- `GT-60X40-14` (GT Tube, 60x40, 1.4mm)
- `GI-65-16` (GI Tube, 65mm, 1.6mm)
- `TB-047-06F` (Tata Bluescope, 0.47mm, 6F)

### 4. Stock Management
- **Per-Variant Stock**: Track quantity for each SKU
- **Weight-Based Support**: Some products sold by KG, others by pieces
- **Unit Types**: PIECE, KG, METER, BOX, etc.
- **Low-Stock Alerts**: Automatic when stock ≤ minStock
- **Stock Movements**: Complete audit trail of all adjustments

### 5. Price History Tracking
- Every price change is logged with:
  - Old and new price
  - Changed by (user)
  - Timestamp
  - Price type (purchase/dealer/wholesale/retail)

**Benefit**: Old invoices retain historical prices, full compliance audit trail

### 6. Multi-Customer Pricing
During billing:
1. Select customer
2. Fetch customer type (RETAIL/WHOLESALE/DEALER)
3. Auto-populate items with applicable pricing tier
4. Calculate totals

### 7. Supplier & Customer Ledgers
Track financial relationships:
- **Supplier Ledger**: Purchase history, outstanding balance, payments
- **Customer Ledger**: Total purchases, outstanding balance, payment history

### 8. Comprehensive Audit Trail
```
auditLog
├── User action
├── Module affected (inventory/billing/purchase)
├── Entity ID
├── Old & new values
└── Timestamp
```

---

## Performance Optimization Strategies

### Database Indexing
- SKU and barcode indexes for fast search
- Variant ID indexes on all transaction tables
- Category and supplier IDs for filtering
- Date indexes on transaction tables for range queries

### Query Optimization
- Use pagination for large result sets
- Lazy load inventory counts
- Cache category/group data (rarely changes)
- Use materialized views for analytics

### Search Performance
- Full-text indexes on product names, SKUs
- Prefix search support for quick filtering
- Barcode/SKU lookup (single index scan)
- Combined filters (category + thickness + size)

### Scaling to 10,000+ Products
- No full product table scans in UI
- Always use filtered queries with indexes
- Paginate search results (20-50 per page)
- Async loading for analytics dashboards

---

## Business Analytics

### Stock Valuation Dashboard
```
Total Inventory Value = Σ(variant.stock × variant.purchasePrice)

By Category:
- Tube Inventory Value: ₹X
- Roofing Sheet Inventory Value: ₹Y
- GI Pipe Inventory Value: ₹Z
- Total: ₹(X+Y+Z)
```

### Sales Analytics
- Highest revenue products
- Highest quantity sold
- Slowest moving products (dead stock)
- Category-wise revenue distribution

### Low Stock Analysis
- Products below minimum stock
- Reorder recommendations
- Supplier preference for restocking

### Financial Analytics
- Outstanding supplier balance
- Outstanding customer receivables
- Payment aging analysis
- Supplier payment terms compliance

---

## Implementation Roadmap

### Phase 1: Core Structure (Current)
- ✅ Database schema with hierarchical structure
- ✅ Better Auth integration
- ✅ Basic product management UI
- ✅ Category and Product Group management

### Phase 2: Advanced Inventory
- [ ] Bulk product import (Excel/CSV)
- [ ] Advanced product search with filters
- [ ] Stock movement tracking
- [ ] Low-stock alerts and notifications

### Phase 3: Business Features
- [ ] Multi-price tier management
- [ ] Price history and price change notifications
- [ ] Customer & Supplier ledgers
- [ ] Purchase order management

### Phase 4: Analytics & Reporting
- [ ] Stock valuation dashboard
- [ ] Sales analytics
- [ ] Financial reports
- [ ] Custom report builder

### Phase 5: Advanced Features
- [ ] Length-based billing
- [ ] Batch/lot tracking
- [ ] Serial number tracking
- [ ] Warehouse management

---

## Environment Variables Required

```
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=...
```

---

## Important Notes

1. **No Product Cloning**: Don't create separate products for each variant. Use the hierarchical structure.
2. **Historical Pricing**: Price history table ensures old invoices retain correct pricing.
3. **Performance First**: Design all queries to use indexes. Avoid N+1 queries.
4. **Audit Everything**: All modifications must be logged in auditLog for compliance.
5. **User Scoping**: All queries must filter by user for multi-tenant scenarios.

---

Generated: 2026-06-10
System: Steel & Roofing Products Inventory Management Platform
