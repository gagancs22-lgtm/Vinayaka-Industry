# Dummy Tools Scripts - Quick Reference

This directory contains scripts for managing 20 dummy tools in your database.

## Files

### `seed-dummy-tools.mjs`
**Purpose**: Add 20 dummy tools to the database for testing

**What it does**:
1. Creates a "Tools & Equipment" category (if not exists)
2. Creates 20 dummy tool products with unique SKUs
3. Creates a default variant for each tool with randomized pricing
4. Assigns random stock quantities (10-110 units)

**How to use**:
```bash
npm run seed-dummy-tools
```

**Markers for identification**:
- SKU Pattern: `DUMMY_TOOL_FOR_TESTING_*`
- Category: "Tools & Equipment"
- Description: "Testing dummy tool - [Tool Name]"

### `remove-dummy-tools.mjs`
**Purpose**: Safely remove all dummy tools from the database

**What it does**:
1. Finds all products with SKU containing `DUMMY_TOOL_FOR_TESTING`
2. Deletes related data (stock movements, price history, variants)
3. Deletes the product itself
4. Removes empty "Tools & Equipment" category

**How to use**:
```bash
npm run remove-dummy-tools
```

**Safety features**:
- Only removes items marked as dummy tools
- Won't delete real products
- Deletes related data before product deletion
- Fully reversible (just re-run seed script)

## 20 Dummy Tools to be Created

| SKU | Name | Purchase Price | Selling Price | Stock |
|-----|------|----------------|---------------|-------|
| DUMMY_TOOL_FOR_TESTING_HAMMER | Hammer | ₹100-1100 | ₹150-1650 | 10-110 |
| DUMMY_TOOL_FOR_TESTING_WRENCH | Wrench Set | ₹100-1100 | ₹150-1650 | 10-110 |
| DUMMY_TOOL_FOR_TESTING_SCREWDRIVER | Screwdriver | ₹100-1100 | ₹150-1650 | 10-110 |
| DUMMY_TOOL_FOR_TESTING_DRILL | Power Drill | ₹100-1100 | ₹150-1650 | 10-110 |
| DUMMY_TOOL_FOR_TESTING_SAW | Saw | ₹100-1100 | ₹150-1650 | 10-110 |
| DUMMY_TOOL_FOR_TESTING_TAPE | Measuring Tape | ₹100-1100 | ₹150-1650 | 10-110 |
| DUMMY_TOOL_FOR_TESTING_LEVEL | Level | ₹100-1100 | ₹150-1650 | 10-110 |
| DUMMY_TOOL_FOR_TESTING_PLIERS | Pliers | ₹100-1100 | ₹150-1650 | 10-110 |
| DUMMY_TOOL_FOR_TESTING_ADJ_WRENCH | Adjustable Wrench | ₹100-1100 | ₹150-1650 | 10-110 |
| DUMMY_TOOL_FOR_TESTING_SOCKET | Socket Set | ₹100-1100 | ₹150-1650 | 10-110 |
| DUMMY_TOOL_FOR_TESTING_ALLEN | Allen Keys | ₹100-1100 | ₹150-1650 | 10-110 |
| DUMMY_TOOL_FOR_TESTING_CHISEL | Chisel | ₹100-1100 | ₹150-1650 | 10-110 |
| DUMMY_TOOL_FOR_TESTING_PLANE | Hand Plane | ₹100-1100 | ₹150-1650 | 10-110 |
| DUMMY_TOOL_FOR_TESTING_CLAMPS | Clamps | ₹100-1100 | ₹150-1650 | 10-110 |
| DUMMY_TOOL_FOR_TESTING_MALLET | Mallet | ₹100-1100 | ₹150-1650 | 10-110 |
| DUMMY_TOOL_FOR_TESTING_BELT | Tool Belt | ₹100-1100 | ₹150-1650 | 10-110 |
| DUMMY_TOOL_FOR_TESTING_TOOLBOX | Toolbox | ₹100-1100 | ₹150-1650 | 10-110 |
| DUMMY_TOOL_FOR_TESTING_FLASHLIGHT | Flashlight | ₹100-1100 | ₹150-1650 | 10-110 |
| DUMMY_TOOL_FOR_TESTING_GLOVES | Work Gloves | ₹100-1100 | ₹150-1650 | 10-110 |
| DUMMY_TOOL_FOR_TESTING_GOGGLES | Safety Goggles | ₹100-1100 | ₹150-1650 | 10-110 |

## How to Identify Dummy Tools

After seeding, find dummy tools by:

### Method 1: Check SKU
All dummy tool SKUs contain: `DUMMY_TOOL_FOR_TESTING`

### Method 2: Check Category
All dummy tools are in: `Tools & Equipment` category

### Method 3: Check Description
All descriptions contain: `Testing dummy tool`

### Method 4: Prisma Studio
```bash
npm run db:studio
# Navigate to Product table
# Filter by: sku contains "DUMMY_TOOL_FOR_TESTING"
```

### Method 5: Code Query
```javascript
const dummyTools = await prisma.product.findMany({
  where: {
    sku: { contains: "DUMMY_TOOL_FOR_TESTING" }
  }
});
console.log(`Found ${dummyTools.length} dummy tools`);
```

## Complete Workflow

### Add and Test
```bash
# 1. Ensure database is connected
echo "✓ DATABASE_URL configured in .env.local"

# 2. Sync schema
npm run db:push

# 3. Add dummy tools
npm run seed-dummy-tools
# Output: Successfully seeded 20 dummy tools!

# 4. Test features
# - Create purchases with dummy tools
# - Create sales bills with dummy tools
# - Test inventory management
# - Test reports and analytics

# 5. Clean up before deployment
npm run remove-dummy-tools
# Output: Successfully removed 20 dummy tools!
```

## Troubleshooting

### Script fails with "DATABASE_URL not found"
**Cause**: Environment variables not configured  
**Solution**:
```bash
cp .env.example .env.local
# Edit .env.local and add your MongoDB URI
npm run seed-dummy-tools
```

### Script fails with "Prisma client error"
**Cause**: Prisma client not generated  
**Solution**:
```bash
npx prisma generate
npm run seed-dummy-tools
```

### Tools don't appear in UI
**Cause**: Filters or API pagination  
**Solution**:
```bash
npm run db:studio
# Search for tools in Product table
# Verify category "Tools & Equipment" exists
```

### Want to modify prices or stock
**Solution**: Edit the `dummyTools` array in `seed-dummy-tools.mjs`
```javascript
// Change pricing range
purchasePrice: Math.random() * 2000 + 200,  // ₹200-2200
sellingPrice: Math.random() * 3000 + 300,   // ₹300-3300

// Change stock range
stock: Math.floor(Math.random() * 500) + 50,  // 50-550 units
```

## Advanced Usage

### Count Dummy Tools
```bash
# Using Prisma Studio
npm run db:studio
# Look at Product count filtered by SKU

# Using code
const count = await prisma.product.count({
  where: { sku: { contains: "DUMMY_TOOL_FOR_TESTING" } }
});
```

### Export Dummy Tools Data
```javascript
const dummyTools = await prisma.product.findMany({
  where: { sku: { contains: "DUMMY_TOOL_FOR_TESTING" } },
  include: { variants: true }
});
console.log(JSON.stringify(dummyTools, null, 2));
```

### Reset Everything
```bash
# Remove dummy tools
npm run remove-dummy-tools

# Re-seed
npm run seed-dummy-tools
```

## Performance Notes

- **Seed Time**: < 5 seconds for 20 tools
- **Cleanup Time**: < 2 seconds
- **Database Size**: Minimal (20 products + 20 variants)
- **No Impact**: Doesn't affect real product data

## Support

Refer to main documentation:
- [DUMMY_TOOLS_GUIDE.md](../DUMMY_TOOLS_GUIDE.md) - Complete guide
- [DUMMY_TOOLS_SETUP.md](../DUMMY_TOOLS_SETUP.md) - Quick start

---

**Last Updated**: 2026-06-10  
**Status**: Ready to Use  
**Requires**: MongoDB or SQL database connection
