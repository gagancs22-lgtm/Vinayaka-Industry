// app/api/inventory/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const limit = parseInt(searchParams.get("limit") || "100");

  const variants = await prisma.productVariant.findMany({
    where: search
      ? {
          OR: [
            { sku: { contains: search, mode: "insensitive" } },
            { product: { name: { contains: search, mode: "insensitive" } } },
          ],
        }
      : undefined,
    include: {
      product: {
        include: { category: { select: { name: true } } },
      },
    },
    orderBy: { stock: "asc" },
    take: limit,
  });

  const data = variants.map(v => ({
    id: v.id,
    name: v.name,
    sku: v.sku,
    productName: v.product.name,
    category: v.product.category.name,
    unitType: v.product.unitType,
    stock: v.stock,
    minStock: v.minStock,
    purchasePrice: v.purchasePrice,
    sellingPrice: v.sellingPrice,
  }));

  return NextResponse.json({ data });
}
