// app/api/reports/export/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import ExcelJS from "exceljs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "sales"; // sales | inventory | purchases | expenses
  const format = searchParams.get("format") || "excel";
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (format === "excel") {
    return generateExcelReport(type, from, to);
  }

  return NextResponse.json({ error: "Unsupported format" }, { status: 400 });
}

async function generateExcelReport(
  type: string,
  from: string | null,
  to: string | null
) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(type.toUpperCase());

  const dateFilter = {
    ...(from && { gte: new Date(from) }),
    ...(to && { lte: new Date(to + "T23:59:59.999Z") }),
  };

  // Style helpers
  const headerStyle: Partial<ExcelJS.Style> = {
    font: { bold: true, color: { argb: "FFFFFFFF" } },
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF1d4ed8" } },
    alignment: { horizontal: "center", vertical: "middle" },
    border: {
      bottom: { style: "thin", color: { argb: "FFe5e7eb" } },
    },
  };

  if (type === "sales") {
    const bills = await prisma.bill.findMany({
      where: {
        status: "PAID",
        ...(from || to ? { billDate: dateFilter } : {}),
      },
      include: {
        items: true,
        user: { select: { name: true } },
      },
      orderBy: { billDate: "desc" },
    });

    worksheet.columns = [
      { header: "Invoice #", key: "invoice", width: 20 },
      { header: "Date", key: "date", width: 15 },
      { header: "Customer", key: "customer", width: 20 },
      { header: "Items", key: "items", width: 10 },
      { header: "Subtotal", key: "subtotal", width: 15 },
      { header: "Discount", key: "discount", width: 12 },
      { header: "Tax", key: "tax", width: 12 },
      { header: "Total", key: "total", width: 15 },
      { header: "Payment", key: "payment", width: 12 },
      { header: "Staff", key: "staff", width: 15 },
    ];

    worksheet.getRow(1).eachCell((cell) => {
      Object.assign(cell, headerStyle);
    });
    worksheet.getRow(1).height = 30;

    bills.forEach((bill, idx) => {
      const row = worksheet.addRow({
        invoice: bill.invoiceNumber,
        date: new Date(bill.billDate).toLocaleDateString("en-IN"),
        customer: bill.customerName || "-",
        items: bill.items.length,
        subtotal: bill.subtotal,
        discount: bill.discount,
        tax: bill.tax,
        total: bill.totalAmount,
        payment: bill.paymentMethod,
        staff: bill.user.name,
      });

      // Alternate row coloring
      if (idx % 2 === 0) {
        row.eachCell((cell) => {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF9FAFB" },
          };
        });
      }
    });

    // Totals row
    const totalRow = worksheet.addRow({
      invoice: "TOTAL",
      total: bills.reduce((s, b) => s + b.totalAmount, 0),
      discount: bills.reduce((s, b) => s + b.discount, 0),
      tax: bills.reduce((s, b) => s + b.tax, 0),
    });
    totalRow.font = { bold: true };
    totalRow.getCell("invoice").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFdbeafe" },
    };

  } else if (type === "inventory") {
    const variants = await prisma.productVariant.findMany({
      include: {
        product: {
          include: { category: { select: { name: true } } },
        },
      },
      orderBy: { stock: "asc" },
    });

    worksheet.columns = [
      { header: "SKU", key: "sku", width: 15 },
      { header: "Product", key: "product", width: 25 },
      { header: "Variant", key: "variant", width: 15 },
      { header: "Category", key: "category", width: 18 },
      { header: "Stock", key: "stock", width: 10 },
      { header: "Min Stock", key: "minStock", width: 12 },
      { header: "Status", key: "status", width: 15 },
      { header: "Purchase Price", key: "purchasePrice", width: 18 },
      { header: "Selling Price", key: "sellingPrice", width: 15 },
      { header: "Stock Value", key: "stockValue", width: 15 },
    ];

    worksheet.getRow(1).eachCell((cell) => {
      Object.assign(cell, headerStyle);
    });
    worksheet.getRow(1).height = 30;

    variants.forEach((v) => {
      const stockStatus =
        v.stock === 0
          ? "Out of Stock"
          : v.stock <= v.minStock
          ? "Low Stock"
          : "In Stock";

      const row = worksheet.addRow({
        sku: v.sku,
        product: v.product.name,
        variant: v.name,
        category: v.product.category.name,
        stock: v.stock,
        minStock: v.minStock,
        status: stockStatus,
        purchasePrice: v.purchasePrice,
        sellingPrice: v.sellingPrice,
        stockValue: v.stock * v.purchasePrice,
      });

      // Color code by stock status
      const statusCell = row.getCell("status");
      if (stockStatus === "Out of Stock") {
        statusCell.font = { color: { argb: "FFef4444" }, bold: true };
      } else if (stockStatus === "Low Stock") {
        statusCell.font = { color: { argb: "FFf97316" }, bold: true };
      } else {
        statusCell.font = { color: { argb: "FF22c55e" } };
      }
    });

  } else if (type === "expenses") {
    const expenses = await prisma.expense.findMany({
      where: from || to ? { date: dateFilter } : {},
      include: { user: { select: { name: true } } },
      orderBy: { date: "desc" },
    });

    worksheet.columns = [
      { header: "Date", key: "date", width: 15 },
      { header: "Category", key: "category", width: 20 },
      { header: "Amount", key: "amount", width: 15 },
      { header: "Description", key: "description", width: 30 },
      { header: "Added By", key: "addedBy", width: 18 },
    ];

    worksheet.getRow(1).eachCell((cell) => {
      Object.assign(cell, headerStyle);
    });
    worksheet.getRow(1).height = 30;

    expenses.forEach((e) => {
      worksheet.addRow({
        date: new Date(e.date).toLocaleDateString("en-IN"),
        category: e.category,
        amount: e.amount,
        description: e.description || "-",
        addedBy: e.user.name,
      });
    });
  }

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer as Buffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${type}-report-${Date.now()}.xlsx"`,
    },
  });
}
