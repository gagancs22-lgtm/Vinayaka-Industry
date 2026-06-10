// app/api/billing/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateInvoiceNumber } from "@/lib/invoice";
import { createAuditLog } from "@/lib/audit";
import { checkLowStockAlerts } from "@/lib/notifications";

export async function GET(req: NextRequest) {
  const userId = req.headers.get("x-user-id")!;
  const { searchParams } = new URL(req.url);

  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const search = searchParams.get("search") || "";
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { invoiceNumber: { contains: search, mode: "insensitive" } },
      { customerName: { contains: search, mode: "insensitive" } },
      { customerPhone: { contains: search, mode: "insensitive" } },
    ];
  }

  if (from || to) {
    where.billDate = {
      ...(from && { gte: new Date(from) }),
      ...(to && { lte: new Date(to + "T23:59:59.999Z") }),
    };
  }

  if (status) where.status = status;

  const [bills, total] = await Promise.all([
    prisma.bill.findMany({
      where,
      include: {
        items: true,
        user: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.bill.count({ where }),
  ]);

  return NextResponse.json({
    data: bills,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}

export async function POST(req: NextRequest) {
  const userId = req.headers.get("x-user-id")!;
  const body = await req.json();

  const {
    customerName,
    customerPhone,
    items, // [{ variantId, quantity, sellingPrice, discount, productName, variantName, unit }]
    discount,
    discountType,
    taxPercent,
    paymentMethod,
    amountPaid,
    notes,
  } = body;

  // Validate stock availability
  for (const item of items) {
    const variant = await prisma.productVariant.findUnique({
      where: { id: item.variantId },
      include: { product: { select: { name: true } } },
    });

    if (!variant) {
      return NextResponse.json(
        { error: `Product variant not found: ${item.variantId}` },
        { status: 400 }
      );
    }

    if (variant.stock < item.quantity) {
      return NextResponse.json(
        {
          error: `Insufficient stock for ${variant.product.name}. Available: ${variant.stock}, Requested: ${item.quantity}`,
        },
        { status: 400 }
      );
    }
  }

  // Generate invoice number
  const invoiceNumber = await generateInvoiceNumber();

  // Calculate totals
  const subtotal = items.reduce(
    (sum: number, item: { quantity: number; sellingPrice: number; discount?: number }) =>
      sum + item.quantity * item.sellingPrice - (item.discount || 0),
    0
  );

  let discountAmount = 0;
  if (discountType === "PERCENT") {
    discountAmount = (subtotal * (discount || 0)) / 100;
  } else {
    discountAmount = discount || 0;
  }

  const afterDiscount = subtotal - discountAmount;
  const taxAmount = (afterDiscount * (taxPercent || 0)) / 100;
  const totalAmount = afterDiscount + taxAmount;
  const change = (amountPaid || 0) - totalAmount;

  // Create bill + items + stock movements in transaction
  const bill = await prisma.$transaction(async (tx) => {
    const newBill = await tx.bill.create({
      data: {
        invoiceNumber,
        customerName,
        customerPhone,
        status: "PAID",
        paymentMethod: paymentMethod || "CASH",
        subtotal,
        discount: discountAmount,
        discountType: discountType || "FLAT",
        tax: taxAmount,
        taxPercent: taxPercent || 0,
        totalAmount,
        amountPaid: amountPaid || totalAmount,
        change: Math.max(0, change),
        notes,
        createdBy: userId,
        items: {
          create: items.map((item: {
            variantId: string;
            productName: string;
            variantName: string;
            quantity: number;
            unit: string;
            sellingPrice: number;
            discount?: number;
          }) => ({
            variantId: item.variantId,
            productName: item.productName,
            variantName: item.variantName,
            quantity: item.quantity,
            unit: item.unit,
            sellingPrice: item.sellingPrice,
            discount: item.discount || 0,
            tax: 0,
            totalPrice: item.quantity * item.sellingPrice - (item.discount || 0),
          })),
        },
      },
      include: { items: true },
    });

    // Deduct stock and create movement records
    for (const item of items) {
      const variant = await tx.productVariant.findUnique({
        where: { id: item.variantId },
      });

      await tx.productVariant.update({
        where: { id: item.variantId },
        data: { stock: { decrement: item.quantity } },
      });

      await tx.stockMovement.create({
        data: {
          variantId: item.variantId,
          type: "SALE",
          quantity: -item.quantity,
          previousStock: variant!.stock,
          newStock: variant!.stock - item.quantity,
          referenceId: newBill.id,
          referenceType: "BILL",
          createdBy: userId,
        },
      });
    }

    return newBill;
  });

  // Check for low stock alerts (non-blocking)
  checkLowStockAlerts(items.map((i: { variantId: string }) => i.variantId)).catch(console.error);

  await createAuditLog({
    userId,
    action: "BILL_CREATED",
    module: "billing",
    entityId: bill.id,
    newValue: { invoiceNumber, totalAmount },
  });

  return NextResponse.json({ data: bill }, { status: 201 });
}
