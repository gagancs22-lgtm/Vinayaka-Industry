// app/api/settings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";

export async function GET() {
  let settings = await prisma.settings.findFirst();
  if (!settings) {
    settings = await prisma.settings.create({
      data: {
        businessName: "My Business",
        invoicePrefix: "INV",
        invoiceCounter: 0,
        taxPercent: 18,
        currency: "INR",
        currencySymbol: "₹",
      },
    });
  }
  return NextResponse.json({ data: settings });
}

export async function PUT(req: NextRequest) {
  const userId = req.headers.get("x-user-id")!;
  const userRole = req.headers.get("x-user-role")!;

  if (userRole !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const settings = await prisma.settings.findFirst();

  if (!settings) {
    return NextResponse.json({ error: "Settings not found" }, { status: 404 });
  }

  const updated = await prisma.settings.update({
    where: { id: settings.id },
    data: {
      businessName:   body.businessName,
      logo:           body.logo,
      gstin:          body.gstin,
      phone:          body.phone,
      email:          body.email,
      address:        body.address,
      invoicePrefix:  body.invoicePrefix,
      taxPercent:     body.taxPercent,
      currency:       body.currency,
      currencySymbol: body.currencySymbol,
      enableTax:      body.enableTax,
      enableDiscount: body.enableDiscount,
      lowStockDefault: body.lowStockDefault,
    },
  });

  await createAuditLog({
    userId,
    action: "SETTINGS_UPDATED",
    module: "settings",
    newValue: body,
  });

  return NextResponse.json({ data: updated });
}
