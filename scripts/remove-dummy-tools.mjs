import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DUMMY_TOOLS_MARKER = "DUMMY_TOOL_FOR_TESTING";

async function removeDummyTools() {
  try {
    console.log("🗑️  Starting to remove dummy tools...\n");

    // Find all dummy products
    const dummyProducts = await prisma.product.findMany({
      where: {
        sku: {
          contains: DUMMY_TOOLS_MARKER,
        },
      },
      include: {
        variants: true,
      },
    });

    if (dummyProducts.length === 0) {
      console.log("✓ No dummy tools found to remove.");
      await prisma.$disconnect();
      return;
    }

    console.log(`Found ${dummyProducts.length} dummy tools to remove:\n`);

    let removedCount = 0;

    for (const product of dummyProducts) {
      try {
        // Delete related data first (variants, stock movements, etc.)
        await prisma.stockMovement.deleteMany({
          where: {
            variant: {
              productId: product.id,
            },
          },
        });

        await prisma.priceHistory.deleteMany({
          where: {
            productId: product.id,
          },
        });

        // Delete all variants
        await prisma.productVariant.deleteMany({
          where: {
            productId: product.id,
          },
        });

        // Delete the product
        await prisma.product.delete({
          where: {
            id: product.id,
          },
        });

        removedCount++;
        console.log(`  ✓ Removed: ${product.name}`);
      } catch (error) {
        console.error(`  ✗ Error removing ${product.name}:`, error.message);
      }
    }

    // Check if Tools & Equipment category is now empty
    const toolsCategory = await prisma.category.findUnique({
      where: { name: "Tools & Equipment" },
      include: { products: true },
    });

    if (toolsCategory && toolsCategory.products.length === 0) {
      await prisma.category.delete({
        where: { id: toolsCategory.id },
      });
      console.log(`\n  ✓ Removed empty "Tools & Equipment" category`);
    }

    console.log(`\n✅ Successfully removed ${removedCount} dummy tools!`);
    await prisma.$disconnect();
  } catch (error) {
    console.error("❌ Error removing dummy tools:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

removeDummyTools();
