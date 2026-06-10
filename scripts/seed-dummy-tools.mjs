import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DUMMY_TOOLS_MARKER = "DUMMY_TOOL_FOR_TESTING"; // Easy identifier for cleanup

async function seedDummyTools() {
  try {
    console.log("🔧 Starting to seed 20 dummy tools...\n");

    // Get or create a "Tools" category
    let toolsCategory = await prisma.category.findUnique({
      where: { name: "Tools & Equipment" },
    });

    if (!toolsCategory) {
      toolsCategory = await prisma.category.create({
        data: {
          name: "Tools & Equipment",
          description: "Testing category for dummy tools",
          color: "#3B82F6",
        },
      });
      console.log("✓ Created Tools & Equipment category");
    }

    const dummyTools = [
      {
        name: "Hammer",
        sku: `${DUMMY_TOOLS_MARKER}_HAMMER`,
        description: "Testing dummy tool - Hammer",
      },
      {
        name: "Wrench Set",
        sku: `${DUMMY_TOOLS_MARKER}_WRENCH`,
        description: "Testing dummy tool - Wrench Set",
      },
      {
        name: "Screwdriver",
        sku: `${DUMMY_TOOLS_MARKER}_SCREWDRIVER`,
        description: "Testing dummy tool - Screwdriver",
      },
      {
        name: "Power Drill",
        sku: `${DUMMY_TOOLS_MARKER}_DRILL`,
        description: "Testing dummy tool - Power Drill",
      },
      {
        name: "Saw",
        sku: `${DUMMY_TOOLS_MARKER}_SAW`,
        description: "Testing dummy tool - Saw",
      },
      {
        name: "Measuring Tape",
        sku: `${DUMMY_TOOLS_MARKER}_TAPE`,
        description: "Testing dummy tool - Measuring Tape",
      },
      {
        name: "Level",
        sku: `${DUMMY_TOOLS_MARKER}_LEVEL`,
        description: "Testing dummy tool - Level",
      },
      {
        name: "Pliers",
        sku: `${DUMMY_TOOLS_MARKER}_PLIERS`,
        description: "Testing dummy tool - Pliers",
      },
      {
        name: "Adjustable Wrench",
        sku: `${DUMMY_TOOLS_MARKER}_ADJ_WRENCH`,
        description: "Testing dummy tool - Adjustable Wrench",
      },
      {
        name: "Socket Set",
        sku: `${DUMMY_TOOLS_MARKER}_SOCKET`,
        description: "Testing dummy tool - Socket Set",
      },
      {
        name: "Allen Keys",
        sku: `${DUMMY_TOOLS_MARKER}_ALLEN`,
        description: "Testing dummy tool - Allen Keys",
      },
      {
        name: "Chisel",
        sku: `${DUMMY_TOOLS_MARKER}_CHISEL`,
        description: "Testing dummy tool - Chisel",
      },
      {
        name: "Hand Plane",
        sku: `${DUMMY_TOOLS_MARKER}_PLANE`,
        description: "Testing dummy tool - Hand Plane",
      },
      {
        name: "Clamps",
        sku: `${DUMMY_TOOLS_MARKER}_CLAMPS`,
        description: "Testing dummy tool - Clamps",
      },
      {
        name: "Mallet",
        sku: `${DUMMY_TOOLS_MARKER}_MALLET`,
        description: "Testing dummy tool - Mallet",
      },
      {
        name: "Tool Belt",
        sku: `${DUMMY_TOOLS_MARKER}_BELT`,
        description: "Testing dummy tool - Tool Belt",
      },
      {
        name: "Toolbox",
        sku: `${DUMMY_TOOLS_MARKER}_TOOLBOX`,
        description: "Testing dummy tool - Toolbox",
      },
      {
        name: "Flashlight",
        sku: `${DUMMY_TOOLS_MARKER}_FLASHLIGHT`,
        description: "Testing dummy tool - Flashlight",
      },
      {
        name: "Work Gloves",
        sku: `${DUMMY_TOOLS_MARKER}_GLOVES`,
        description: "Testing dummy tool - Work Gloves",
      },
      {
        name: "Safety Goggles",
        sku: `${DUMMY_TOOLS_MARKER}_GOGGLES`,
        description: "Testing dummy tool - Safety Goggles",
      },
    ];

    let createdCount = 0;

    for (const tool of dummyTools) {
      // Check if tool already exists
      const existingProduct = await prisma.product.findUnique({
        where: { sku: tool.sku },
      });

      if (existingProduct) {
        console.log(`  ⊘ ${tool.name} (already exists)`);
        continue;
      }

      // Create product
      const product = await prisma.product.create({
        data: {
          name: tool.name,
          sku: tool.sku,
          description: tool.description,
          categoryId: toolsCategory.id,
          unitType: "PIECE",
          status: "ACTIVE",
          minStock: 5,
        },
      });

      // Create variant with pricing
      await prisma.productVariant.create({
        data: {
          productId: product.id,
          name: "Default Variant",
          sku: `${tool.sku}_VAR`,
          purchasePrice: Math.random() * 1000 + 100,
          sellingPrice: Math.random() * 1500 + 150,
          stock: Math.floor(Math.random() * 100) + 10,
          minStock: 5,
          isDefault: true,
        },
      });

      createdCount++;
      console.log(`  ✓ ${tool.name}`);
    }

    console.log(`\n✅ Successfully seeded ${createdCount} dummy tools!`);
    console.log(`\n📋 Dummy Tools Info:`);
    console.log(`   Category: "Tools & Equipment"`);
    console.log(`   Marker: "${DUMMY_TOOLS_MARKER}"`);
    console.log(`   All dummy tools have SKU containing: "${DUMMY_TOOLS_MARKER}"`);
    console.log(
      `\n🗑️  To remove all dummy tools later, run: npm run remove-dummy-tools`
    );

    await prisma.$disconnect();
  } catch (error) {
    console.error("❌ Error seeding dummy tools:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

seedDummyTools();
