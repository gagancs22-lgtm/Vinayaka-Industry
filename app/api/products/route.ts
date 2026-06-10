// app/api/products/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const search = searchParams.get("search") || "";
  const categoryId = searchParams.get("categoryId");
  const status = searchParams.get("status");
  const lowStock = searchParams.get("lowStock") === "true";

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { sku: { contains: search, mode: "insensitive" } },
      { barcode: { contains: search, mode: "insensitive" } },
    ];
  }

  if (categoryId) where.categoryId = categoryId;
  if (status) where.status = status;

  if (lowStock) {
    where.variants = {
      some: {
        stock: { gt: 0 },
        // stock lte minStock handled after fetch
      },
    };
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, color: true } },
        variants: {
          orderBy: { isDefault: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return NextResponse.json({
    data: products,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}

export async function POST(req: NextRequest) {
  const userId = req.headers.get("x-user-id")!;
  const userRole = req.headers.get("x-user-role")!;

  if (userRole !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { variants, ...productData } = body;

  // Check SKU uniqueness
  const existing = await prisma.product.findUnique({
    where: { sku: productData.sku },
  });

  if (existing) {
    return NextResponse.json({ error: "SKU already exists" }, { status: 409 });
  }

  const product = await prisma.product.create({
    data: {
      ...productData,
      variants: {
        create: variants || [],
      },
    },
    include: {
      category: true,
      variants: true,
    },
  });

  await createAuditLog({
    userId,
    action: "PRODUCT_CREATED",
    module: "products",
    entityId: product.id,
    newValue: product,
  });

  return NextResponse.json({ data: product }, { status: 201 });
}

