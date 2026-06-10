// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create default settings
  const existingSettings = await prisma.settings.findFirst();
  if (!existingSettings) {
    await prisma.settings.create({
      data: {
        businessName: "My Inventory Store",
        invoicePrefix: "INV",
        invoiceCounter: 0,
        taxPercent: 18,
        currency: "INR",
        currencySymbol: "₹",
        enableTax: true,
        enableDiscount: true,
        lowStockDefault: 10,
      },
    });
    console.log("✅ Settings created");
  }

  // Create admin user
  const existingAdmin = await prisma.user.findFirst({
    where: { email: "admin@example.com" },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash("Admin@123", 12);
    await prisma.user.create({
      data: {
        name: "Admin User",
        email: "admin@example.com",
        password: hashedPassword,
        role: "ADMIN",
        status: "ACTIVE",
      },
    });
    console.log("✅ Admin user created: admin@example.com / Admin@123");
  }

  // Create sample categories
  const categories = [
    { name: "Beverages", color: "#3b82f6" },
    { name: "Grains & Cereals", color: "#f59e0b" },
    { name: "Dairy", color: "#8b5cf6" },
    { name: "Snacks", color: "#ec4899" },
    { name: "Household", color: "#10b981" },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }
  console.log("✅ Categories created");

  // Create sample supplier
  const supplier = await prisma.supplier.upsert({
    where: { id: "sample-supplier" },
    update: {},
    create: {
      name: "Metro Wholesale",
      contactPerson: "Rajesh Kumar",
      phone: "+91 98765 43210",
      email: "metro@example.com",
      address: "123 Market Street, Mangaluru",
    },
  }).catch(() =>
    prisma.supplier.create({
      data: {
        name: "Metro Wholesale",
        contactPerson: "Rajesh Kumar",
        phone: "+91 98765 43210",
        email: "metro@example.com",
        address: "123 Market Street, Mangaluru",
      },
    })
  );
  console.log("✅ Sample supplier created");

  // Create sample products
  const beveragesCategory = await prisma.category.findFirst({
    where: { name: "Beverages" },
  });

  if (beveragesCategory) {
    await prisma.product.upsert({
      where: { sku: "COKE-001" },
      update: {},
      create: {
        name: "Coca Cola",
        sku: "COKE-001",
        categoryId: beveragesCategory.id,
        unitType: "MILLILITER",
        sellMethod: "BY_QUANTITY",
        status: "ACTIVE",
        minStock: 20,
        variants: {
          create: [
            {
              name: "250ml",
              sku: "COKE-250",
              purchasePrice: 12,
              sellingPrice: 20,
              stock: 100,
              minStock: 20,
              isDefault: false,
            },
            {
              name: "500ml",
              sku: "COKE-500",
              purchasePrice: 22,
              sellingPrice: 35,
              stock: 80,
              minStock: 20,
              isDefault: true,
            },
            {
              name: "2L",
              sku: "COKE-2L",
              purchasePrice: 68,
              sellingPrice: 95,
              stock: 40,
              minStock: 10,
              isDefault: false,
            },
          ],
        },
      },
    });
  }

  const grainsCategory = await prisma.category.findFirst({
    where: { name: "Grains & Cereals" },
  });

  if (grainsCategory) {
    await prisma.product.upsert({
      where: { sku: "RICE-001" },
      update: {},
      create: {
        name: "Basmati Rice",
        sku: "RICE-001",
        categoryId: grainsCategory.id,
        unitType: "KG",
        sellMethod: "BY_WEIGHT",
        status: "ACTIVE",
        minStock: 50,
        variants: {
          create: [
            {
              name: "1 KG",
              sku: "RICE-1KG",
              purchasePrice: 65,
              sellingPrice: 85,
              stock: 200,
              minStock: 50,
              isDefault: false,
            },
            {
              name: "5 KG",
              sku: "RICE-5KG",
              purchasePrice: 310,
              sellingPrice: 400,
              stock: 80,
              minStock: 20,
              isDefault: true,
            },
            {
              name: "25 KG",
              sku: "RICE-25KG",
              purchasePrice: 1450,
              sellingPrice: 1800,
              stock: 15,
              minStock: 5,
              isDefault: false,
            },
          ],
        },
      },
    });
  }

  console.log("✅ Sample products created");
  console.log("\n🎉 Seeding complete!\n");
  console.log("Login credentials:");
  console.log("  Email: admin@example.com");
  console.log("  Password: Admin@123");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
