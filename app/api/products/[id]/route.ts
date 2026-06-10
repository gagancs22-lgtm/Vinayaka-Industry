// app/api/products/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      variants: { orderBy: { isDefault: "desc" } },
      priceHistory: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: product });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = req.headers.get("x-user-id")!;
  const userRole = req.headers.get("x-user-role")!;
  if (userRole !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { variants, ...productData } = body;

  const oldProduct = await prisma.product.findUnique({
    where: { id },
    include: { variants: true },
  });
  if (!oldProduct) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Track price changes
  if (variants) {
    for (const v of variants) {
      if (!v.id) continue;
      const old = oldProduct.variants.find(ov => ov.id === v.id);
      if (!old) continue;

      const changes: { priceType: "PURCHASE" | "SELLING"; oldPrice: number; newPrice: number }[] = [];
      if (v.purchasePrice !== old.purchasePrice) {
        changes.push({ priceType: "PURCHASE", oldPrice: old.purchasePrice, newPrice: v.purchasePrice });
      }
      if (v.sellingPrice !== old.sellingPrice) {
        changes.push({ priceType: "SELLING", oldPrice: old.sellingPrice, newPrice: v.sellingPrice });
      }

      for (const ch of changes) {
        await prisma.priceHistory.create({
          data: {
            productId: id,
            variantId: v.id,
            priceType: ch.priceType,
            oldPrice: ch.oldPrice,
            newPrice: ch.newPrice,
            changedBy: userId,
          },
        });
      }

      // Update variant
      await prisma.productVariant.update({
        where: { id: v.id },
        data: {
          name: v.name,
          sku: v.sku,
          barcode: v.barcode,
          purchasePrice: v.purchasePrice,
          sellingPrice: v.sellingPrice,
          minStock: v.minStock,
          isDefault: v.isDefault,
        },
      });
    }
  }

  const updated = await prisma.product.update({
    where: { id },
    data: {
      name: productData.name,
      barcode: productData.barcode,
      description: productData.description,
      categoryId: productData.categoryId,
      unitType: productData.unitType,
      sellMethod: productData.sellMethod,
      status: productData.status,
      minStock: productData.minStock,
      image: productData.image,
    },
    include: { category: true, variants: true },
  });

  await createAuditLog({ userId, action: "PRODUCT_UPDATED", module: "products", entityId: id, oldValue: oldProduct, newValue: updated });
  return NextResponse.json({ data: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = req.headers.get("x-user-id")!;
  const userRole = req.headers.get("x-user-role")!;
  if (userRole !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Soft delete — set inactive rather than hard delete to preserve bill history
  await prisma.product.update({ where: { id }, data: { status: "INACTIVE" } });
  await createAuditLog({ userId, action: "PRODUCT_DELETED", module: "products", entityId: id, oldValue: product });
  return NextResponse.json({ success: true });
}
