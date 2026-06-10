// app/api/inventory/movements/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit  = parseInt(searchParams.get("limit") || "50");
  const page   = parseInt(searchParams.get("page")  || "1");
  const type   = searchParams.get("type");
  const from   = searchParams.get("from");
  const to     = searchParams.get("to");

  const where: Record<string, unknown> = {};
  if (type) where.type = type;
  if (from || to) {
    where.createdAt = {
      ...(from && { gte: new Date(from) }),
      ...(to   && { lte: new Date(to + "T23:59:59.999Z") }),
    };
  }

  const [movements, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      include: {
        variant: {
          include: { product: { select: { name: true } } },
        },
        user: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.stockMovement.count({ where }),
  ]);

  const data = movements.map(m => ({
    id: m.id,
    type: m.type,
    quantity: m.quantity,
    previousStock: m.previousStock,
    newStock: m.newStock,
    productName: m.variant.product.name,
    variantName: m.variant.name,
    notes: m.notes,
    referenceType: m.referenceType,
    referenceId: m.referenceId,
    createdAt: m.createdAt,
    user: m.user,
  }));

  return NextResponse.json({
    data,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}

// POST — manual stock adjustment
export async function POST(req: NextRequest) {
  const userId = req.headers.get("x-user-id")!;
  const body = await req.json();
  const { variantId, type, quantity, notes } = body;

  const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
  if (!variant) {
    return NextResponse.json({ error: "Variant not found" }, { status: 404 });
  }

  // Positive types: PURCHASE, RETURN_IN, ADJUSTMENT(+)
  // Negative types: SALE, DAMAGE, RETURN_OUT, EXPIRY, INTERNAL_USAGE, ADJUSTMENT(-)
  const NEGATIVE_TYPES = ["SALE", "DAMAGE", "RETURN_OUT", "EXPIRY", "INTERNAL_USAGE"];
  const sign = NEGATIVE_TYPES.includes(type) ? -1 : 1;
  const delta = Math.abs(quantity) * sign;
  const newStock = variant.stock + delta;

  if (newStock < 0) {
    return NextResponse.json({ error: "Insufficient stock" }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.productVariant.update({
      where: { id: variantId },
      data: { stock: newStock },
    }),
    prisma.stockMovement.create({
      data: {
        variantId,
        type,
        quantity: delta,
        previousStock: variant.stock,
        newStock,
        notes,
        createdBy: userId,
      },
    }),
  ]);

  await createAuditLog({
    userId,
    action: "STOCK_ADJUSTED",
    module: "inventory",
    entityId: variantId,
    newValue: { type, quantity: delta, newStock },
  });

  return NextResponse.json({ data: { newStock } });
}
