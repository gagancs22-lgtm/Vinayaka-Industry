// app/api/invoices/route.ts
// Dedicated invoice endpoint — supports all invoice types with full GST fields
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateGSTInvoicePDF } from "@/lib/gst-invoice-pdf";
import { generateInvoiceNumber } from "@/lib/invoice";
import { createAuditLog } from "@/lib/audit";
import type { InvoiceData } from "@/lib/gst-invoice-pdf";

// GET /api/invoices — list
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page   = parseInt(searchParams.get("page")  || "1");
  const limit  = parseInt(searchParams.get("limit") || "20");
  const status = searchParams.get("status");
  const type   = searchParams.get("type");
  const search = searchParams.get("search") || "";
  const from   = searchParams.get("from");
  const to     = searchParams.get("to");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (type)   where.invoiceType = type;
  if (search) {
    where.OR = [
      { invoiceNumber: { contains: search, mode: "insensitive" } },
      { customerName:  { contains: search, mode: "insensitive" } },
    ];
  }
  if (from || to) {
    where.invoiceDate = {
      ...(from && { gte: new Date(from) }),
      ...(to   && { lte: new Date(to + "T23:59:59.999Z") }),
    };
  }

  const [invoices, total] = await Promise.all([
    prisma.bill.findMany({
      where,
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.bill.count({ where }),
  ]);

  return NextResponse.json({
    data: invoices,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}

// POST /api/invoices — create full GST invoice
export async function POST(req: NextRequest) {
  const userId = req.headers.get("x-user-id")!;
  const body: InvoiceData & {
    status?: string;
    customerId?: string;
    amountPaid?: number;
  } = await req.json();

  const invoiceNumber = await generateInvoiceNumber();

  // Build the bill record — reusing the Bill model
  const bill = await prisma.bill.create({
    data: {
      invoiceNumber,
      billDate: new Date(),
      customerName: body.billTo.name,
      customerPhone: body.billTo.phone,
      status: (body.status as "DRAFT" | "PAID" | "CANCELLED") || "DRAFT",
      paymentMethod: "CASH",
      subtotal: body.items.reduce((s, i) => s + i.qty * i.rate, 0),
      discount: 0,
      discountType: "FLAT",
      tax: 0,
      taxPercent: 0,
      totalAmount: 0,   // will update below after calc
      amountPaid: body.amountPaid || 0,
      change: 0,
      notes: body.notes,
      createdBy: userId,
      items: {
        create: body.items.map(item => ({
          variantId: item.hsn, // store HSN in variantId for standalone invoices
          productName: item.name,
          variantName: item.description || "",
          quantity: item.qty,
          unit: item.unit,
          sellingPrice: item.rate,
          discount: (item.discountPct || 0) / 100 * item.qty * item.rate,
          tax: item.qty * item.rate * (1 - (item.discountPct || 0) / 100) * item.taxPct / 100,
          totalPrice: item.qty * item.rate * (1 - (item.discountPct || 0) / 100) * (1 + item.taxPct / 100),
        })),
      },
    },
    include: { items: true },
  });

  await createAuditLog({
    userId,
    action: "INVOICE_CREATED",
    module: "invoices",
    entityId: bill.id,
    newValue: { invoiceNumber, type: body.invoiceType },
  });

  return NextResponse.json({ data: bill }, { status: 201 });
}
