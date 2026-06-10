// app/api/purchases/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const userId = req.headers.get("x-user-id")!;
  const body = await req.json();

  const {
    supplierId,
    invoiceNumber,
    purchaseDate,
    items, // [{ variantId, quantity, purchasePrice }]
    tax,
    discount,
    notes,
  } = body;

  const subtotal = items.reduce(
    (sum: number, item: { quantity: number; purchasePrice: number }) =>
      sum + item.quantity * item.purchasePrice,
    0
  );

  const taxAmount = tax || 0;
  const discountAmount = discount || 0;
  const totalAmount = subtotal + taxAmount - discountAmount;

  // Create purchase + items + stock movements in transaction
  const purchase = await prisma.$transaction(async (tx) => {
    const newPurchase = await tx.purchase.create({
      data: {
        supplierId,
        invoiceNumber,
        purchaseDate: new Date(purchaseDate),
        status: "RECEIVED",
        subtotal,
        tax: taxAmount,
        discount: discountAmount,
        totalAmount,
        notes,
        createdBy: userId,
        items: {
          create: items.map((item: {
            variantId: string;
            quantity: number;
            purchasePrice: number;
          }) => ({
            variantId: item.variantId,
            quantity: item.quantity,
            purchasePrice: item.purchasePrice,
            totalPrice: item.quantity * item.purchasePrice,
          })),
        },
      },
      include: { items: true, supplier: true },
    });

    // Increase stock for each item
    for (const item of items) {
      const variant = await tx.productVariant.findUnique({
        where: { id: item.variantId },
      });

      if (!variant) continue;

      await tx.productVariant.update({
        where: { id: item.variantId },
        data: { stock: { increment: item.quantity } },
      });

      // Update purchase price on variant
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: { purchasePrice: item.purchasePrice },
      });

      await tx.stockMovement.create({
        data: {
          variantId: item.variantId,
          type: "PURCHASE",
          quantity: item.quantity,
          previousStock: variant.stock,
          newStock: variant.stock + item.quantity,
          referenceId: newPurchase.id,
          referenceType: "PURCHASE",
          createdBy: userId,
          notes: `Purchase from ${newPurchase.supplier.name}`,
        },
      });

      // Record price history if changed
      if (item.purchasePrice !== variant.purchasePrice) {
        await tx.priceHistory.create({
          data: {
            productId: variant.productId,
            variantId: variant.id,
            priceType: "PURCHASE",
            oldPrice: variant.purchasePrice,
            newPrice: item.purchasePrice,
            changedBy: userId,
            reason: `Updated via purchase ${newPurchase.id}`,
          },
        });
      }
    }

    return newPurchase;
  });

  await createAuditLog({
    userId,
    action: "PURCHASE_CREATED",
    module: "purchases",
    entityId: purchase.id,
    newValue: { supplierId, totalAmount, itemCount: items.length },
  });

  return NextResponse.json({ data: purchase }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const supplierId = searchParams.get("supplierId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: Record<string, unknown> = {};
  if (supplierId) where.supplierId = supplierId;
  if (from || to) {
    where.purchaseDate = {
      ...(from && { gte: new Date(from) }),
      ...(to && { lte: new Date(to + "T23:59:59.999Z") }),
    };
  }

  const [purchases, total] = await Promise.all([
    prisma.purchase.findMany({
      where,
      include: {
        supplier: { select: { id: true, name: true } },
        user: { select: { name: true } },
        items: {
          include: {
            variant: {
              include: { product: { select: { name: true } } },
            },
          },
        },
      },
      orderBy: { purchaseDate: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.purchase.count({ where }),
  ]);

  return NextResponse.json({
    data: purchases,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}
