# Dummy Tools for Testing - Setup Guide

This guide explains how to add and remove 20 dummy tools (products) to your database for testing purposes.

## Overview

- **Dummy Tools Count**: 20 products
- **Category**: "Tools & Equipment"
- **Marker**: `DUMMY_TOOL_FOR_TESTING`
- **Easy Cleanup**: All dummy tools are marked and can be removed with a single command

## Prerequisites

Before running the dummy tools scripts, ensure:

1. **Database is Connected**
   - MongoDB (recommended): Set `DATABASE_URL` in your `.env.local` file
   - Example: `DATABASE_URL="mongodb+srv://user:password@cluster.mongodb.net/inventory?retryWrites=true&w=majority"`

2. **Environment Variables Configured**
   ```bash
   cp .env.example .env.local
   # Then update DATABASE_URL and other required variables
   ```

3. **Database Synced with Prisma**
   ```bash
   npm run db:push
   ```

## Available Dummy Tools

The seed script will add 20 dummy tools:

| # | Tool Name | SKU Format |
|---|-----------|-----------|
| 1 | Hammer | DUMMY_TOOL_FOR_TESTING_HAMMER |
| 2 | Wrench Set | DUMMY_TOOL_FOR_TESTING_WRENCH |
| 3 | Screwdriver | DUMMY_TOOL_FOR_TESTING_SCREWDRIVER |
| 4 | Power Drill | DUMMY_TOOL_FOR_TESTING_DRILL |
| 5 | Saw | DUMMY_TOOL_FOR_TESTING_SAW |
| 6 | Measuring Tape | DUMMY_TOOL_FOR_TESTING_TAPE |
| 7 | Level | DUMMY_TOOL_FOR_TESTING_LEVEL |
| 8 | Pliers | DUMMY_TOOL_FOR_TESTING_PLIERS |
| 9 | Adjustable Wrench | DUMMY_TOOL_FOR_TESTING_ADJ_WRENCH |
| 10 | Socket Set | DUMMY_TOOL_FOR_TESTING_SOCKET |
| 11 | Allen Keys | DUMMY_TOOL_FOR_TESTING_ALLEN |
| 12 | Chisel | DUMMY_TOOL_FOR_TESTING_CHISEL |
| 13 | Hand Plane | DUMMY_TOOL_FOR_TESTING_PLANE |
| 14 | Clamps | DUMMY_TOOL_FOR_TESTING_CLAMPS |
| 15 | Mallet | DUMMY_TOOL_FOR_TESTING_MALLET |
| 16 | Tool Belt | DUMMY_TOOL_FOR_TESTING_BELT |
| 17 | Toolbox | DUMMY_TOOL_FOR_TESTING_TOOLBOX |
| 18 | Flashlight | DUMMY_TOOL_FOR_TESTING_FLASHLIGHT |
| 19 | Work Gloves | DUMMY_TOOL_FOR_TESTING_GLOVES |
| 20 | Safety Goggles | DUMMY_TOOL_FOR_TESTING_GOGGLES |

## How to Use

### Add Dummy Tools to Database

Run the seed script to add all 20 dummy tools:

```bash
npm run seed-dummy-tools
```

**Output Example:**
```
🔧 Starting to seed 20 dummy tools...

✓ Created Tools & Equipment category
✓ Hammer
✓ Wrench Set
✓ Screwdriver
... (and 17 more)

✅ Successfully seeded 20 dummy tools!

📋 Dummy Tools Info:
   Category: "Tools & Equipment"
   Marker: "DUMMY_TOOL_FOR_TESTING"
   All dummy tools have SKU containing: "DUMMY_TOOL_FOR_TESTING"

🗑️  To remove all dummy tools later, run: npm run remove-dummy-tools
```

### Remove Dummy Tools from Database

To remove all dummy tools and clean up the database:

```bash
npm run remove-dummy-tools
```

**Output Example:**
```
🗑️  Starting to remove dummy tools...

Found 20 dummy tools to remove:

  ✓ Removed: Hammer
  ✓ Removed: Wrench Set
... (and 18 more)

  ✓ Removed empty "Tools & Equipment" category

✅ Successfully removed 20 dummy tools!
```

## Features of the Dummy Tools

Each dummy tool includes:

- **Name**: Product name (e.g., "Hammer")
- **SKU**: Unique identifier with marker (e.g., "DUMMY_TOOL_FOR_TESTING_HAMMER")
- **Description**: Identifies as testing tool
- **Category**: "Tools & Equipment"
- **Unit Type**: "PIECE"
- **Status**: "ACTIVE"
- **Default Variant**: With randomized pricing
  - Purchase Price: ₹100 - ₹1,100
  - Selling Price: ₹150 - ₹1,650
  - Stock: 10 - 110 units

## Identifying Dummy Tools

All dummy tools can be identified by:

1. **SKU Contains**: `DUMMY_TOOL_FOR_TESTING`
2. **Category**: "Tools & Equipment" (empty after cleanup)
3. **Description**: Contains "Testing dummy tool"

### Find Dummy Tools in Database

```bash
# Using Prisma Studio
npm run db:studio

# Then navigate to Product table and filter by SKU containing "DUMMY_TOOL_FOR_TESTING"
```

## Best Practices

✅ **DO:**
- Add dummy tools after setting up the database
- Remove dummy tools before deploying to production
- Use dummy tools to test features like:
  - Product search and filtering
  - Inventory management
  - Purchase orders
  - Sales billing
  - Reporting and analytics

❌ **DON'T:**
- Leave dummy tools in production databases
- Modify dummy tool SKUs (they're used for cleanup)
- Mix dummy tools with real data without clear separation

## Scripts Location

- **Seed Script**: `/scripts/seed-dummy-tools.mjs`
- **Cleanup Script**: `/scripts/remove-dummy-tools.mjs`
- **NPM Commands**: Defined in `package.json`

## Troubleshooting

### Error: "Database URL not found"
**Solution**: Configure `DATABASE_URL` in `.env.local` file

```bash
cp .env.example .env.local
# Edit .env.local and add your MongoDB connection string
npm run db:push
npm run seed-dummy-tools
```

### Error: "Prisma client did not initialize"
**Solution**: Generate Prisma client first

```bash
npx prisma generate
npm run seed-dummy-tools
```

### Dummy Tools Not Appearing in UI
**Solution**: Check the products API and ensure your filters aren't hiding dummy tools

```bash
# View all products in Prisma Studio
npm run db:studio
```

### Want to Modify Dummy Tools?

Edit `/scripts/seed-dummy-tools.mjs` to:
- Add more tools
- Change pricing ranges
- Modify stock quantities
- Update tool descriptions

## Database Cleanup on Reset

If you reset your database completely:

```bash
# Push schema to MongoDB (or your database)
npm run db:push

# Seed with dummy tools
npm run seed-dummy-tools
```

## Integration with Testing

Use dummy tools for:

- **Unit Tests**: Query products with DUMMY_TOOL marker
- **E2E Tests**: Create purchases and sales with dummy tools
- **Load Testing**: Test system with consistent dummy data

```javascript
// Example: Find dummy tools in tests
const dummyTools = await prisma.product.findMany({
  where: {
    sku: {
      contains: "DUMMY_TOOL_FOR_TESTING"
    }
  }
});
```

## Support

If you encounter issues:

1. Check that `DATABASE_URL` is correctly configured
2. Ensure Prisma client is generated: `npx prisma generate`
3. Verify database connectivity: `npm run db:studio`
4. Check script errors in terminal output

---

**Last Updated**: 2026-06-10  
**Version**: 1.0
