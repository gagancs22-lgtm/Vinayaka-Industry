// app/api/billing/[id]/pdf/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateGSTInvoicePDF } from "@/lib/gst-invoice-pdf";
import type { InvoiceData } from "@/lib/gst-invoice-pdf";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const bill = await prisma.bill.findUnique({
    where: { id: params.id },
    include: { items: true, user: { select: { name: true } } },
  });

  if (!bill) {
    return NextResponse.json({ error: "Bill not found" }, { status: 404 });
  }

  const settings = await prisma.settings.findFirst();
  if (!settings) {
    return NextResponse.json({ error: "Settings not configured" }, { status: 500 });
  }

  const data: InvoiceData = {
    invoiceType: "TAX INVOICE",
    number: bill.invoiceNumber,
    date: new Date(bill.billDate).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
    }),
    deliveryTerms: "Over the Counter",
    company: {
      name: settings.businessName,
      address: settings.address || "",
      city: "",
      state: "Karnataka",
      stateCode: "29",
      pincode: "",
      gstin: settings.gstin || "29XXXXX0000X0XX",
      pan: "",
      phone: settings.phone || "",
      email: settings.email || "",
    },
    billTo: {
      name: bill.customerName || "Walk-in Customer",
      address: "",
      city: "",
      state: "Karnataka",
      stateCode: "29",
      pincode: "",
      phone: bill.customerPhone || "",
    },
    items: bill.items.map((item) => ({
      name: item.productName,
      description: item.variantName,
      hsn: "",
      qty: item.quantity,
      unit: item.unit,
      rate: item.sellingPrice,
      discountPct: item.discount > 0
        ? (item.discount / (item.quantity * item.sellingPrice)) * 100
        : 0,
      taxPct: bill.taxPercent || 18,
    })),
    charges: {},
    notes: bill.notes || undefined,
  };

  const pdfBuffer = generateGSTInvoicePDF(data);

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${bill.invoiceNumber}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
