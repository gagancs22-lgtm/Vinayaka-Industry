// app/api/analytics/route.ts
import { NextRequest, NextResponse } from "next/server";

function isDbConfigured(): boolean {
  const url = process.env.DATABASE_URL || "";
  return url.length > 0 && !url.includes("<user>") && !url.includes("<password>");
}

// Empty responses returned when no DB is connected
const EMPTY_DASHBOARD = {
  todayRevenue: 0, todayBillCount: 0, monthRevenue: 0, monthProfit: 0,
  inventoryValue: 0, totalProducts: 0, lowStockCount: 0, outOfStockCount: 0,
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "dashboard";

  if (!isDbConfigured()) {
    if (type === "dashboard") return NextResponse.json({ data: EMPTY_DASHBOARD });
    if (type === "sales-trend") return NextResponse.json({ data: [] });
    if (type === "top-products") return NextResponse.json({ data: [] });
    return NextResponse.json({ data: [] });
  }

  try {
    const { prisma } = await import("@/lib/db");

    if (type === "dashboard") return getDashboardAnalytics(prisma);
    if (type === "sales-trend") {
      const period = searchParams.get("period") || "monthly";
      return getSalesTrend(prisma, period);
    }
    if (type === "top-products") return getTopProducts(prisma);
  } catch (err) {
    console.error("Analytics DB error:", err);
    if (type === "dashboard") return NextResponse.json({ data: EMPTY_DASHBOARD });
    return NextResponse.json({ data: [] });
  }

  return NextResponse.json({ error: "Unknown analytics type" }, { status: 400 });
}

async function getDashboardAnalytics(prisma: any) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [todayBills, monthBills, totalProducts, lowStockVariants, outOfStockVariants, monthExpenses, allVariants] =
    await Promise.all([
      prisma.bill.aggregate({ where: { status: "PAID", billDate: { gte: todayStart } }, _sum: { totalAmount: true }, _count: true }),
      prisma.bill.aggregate({ where: { status: "PAID", billDate: { gte: monthStart } }, _sum: { totalAmount: true }, _count: true }),
      prisma.product.count({ where: { status: "ACTIVE" } }),
      prisma.productVariant.count({ where: { stock: { gt: 0 }, AND: [{ stock: { lte: 10 } }] } }),
      prisma.productVariant.count({ where: { stock: 0 } }),
      prisma.expense.aggregate({ where: { date: { gte: monthStart } }, _sum: { amount: true } }),
      prisma.productVariant.findMany({ select: { stock: true, purchasePrice: true } }),
    ]);

  const inventoryValue = allVariants.reduce((sum: number, v: any) => sum + v.stock * v.purchasePrice, 0);
  const monthPurchases = await prisma.purchaseItem.aggregate({
    where: { purchase: { purchaseDate: { gte: monthStart } } },
    _sum: { totalPrice: true },
  });

  const monthRevenue = monthBills._sum.totalAmount || 0;
  const monthExpenseTotal = monthExpenses._sum.amount || 0;
  const monthPurchaseTotal = monthPurchases._sum.totalPrice || 0;

  return NextResponse.json({
    data: {
      todayRevenue: todayBills._sum.totalAmount || 0,
      todayBillCount: todayBills._count,
      monthRevenue,
      monthProfit: monthRevenue - monthPurchaseTotal - monthExpenseTotal,
      inventoryValue,
      totalProducts,
      lowStockCount: lowStockVariants,
      outOfStockCount: outOfStockVariants,
    },
  });
}

async function getSalesTrend(prisma: any, period: string) {
  const now = new Date();
  let startDate: Date;
  let groupFormat: string;

  if (period === "daily") { startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29); groupFormat = "day"; }
  else if (period === "weekly") { startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1); groupFormat = "week"; }
  else if (period === "yearly") { startDate = new Date(now.getFullYear() - 4, 0, 1); groupFormat = "year"; }
  else { startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1); groupFormat = "month"; }

  const bills = await prisma.bill.findMany({
    where: { status: "PAID", billDate: { gte: startDate } },
    select: { billDate: true, totalAmount: true },
    orderBy: { billDate: "asc" },
  });

  const grouped: Record<string, { revenue: number; count: number }> = {};
  for (const bill of bills) {
    let key: string;
    const d = new Date(bill.billDate);
    if (groupFormat === "day") key = d.toISOString().split("T")[0];
    else if (groupFormat === "week") { const ws = new Date(d); ws.setDate(d.getDate() - d.getDay()); key = ws.toISOString().split("T")[0]; }
    else if (groupFormat === "year") key = String(d.getFullYear());
    else key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!grouped[key]) grouped[key] = { revenue: 0, count: 0 };
    grouped[key].revenue += bill.totalAmount;
    grouped[key].count += 1;
  }

  return NextResponse.json({ data: Object.entries(grouped).map(([period, data]) => ({ period, ...data })) });
}

async function getTopProducts(prisma: any) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const topItems = await prisma.billItem.groupBy({
    by: ["variantId"],
    where: { bill: { status: "PAID", billDate: { gte: thirtyDaysAgo } } },
    _sum: { quantity: true, totalPrice: true },
    orderBy: { _sum: { totalPrice: "desc" } },
    take: 10,
  });

  const variantIds = topItems.map((i: any) => i.variantId);
  const variants = await prisma.productVariant.findMany({
    where: { id: { in: variantIds } },
    include: { product: { select: { name: true } } },
  });

  return NextResponse.json({
    data: topItems.map((item: any) => {
      const variant = variants.find((v: any) => v.id === item.variantId);
      return {
        variantId: item.variantId,
        productName: variant?.product.name || "Unknown",
        variantName: variant?.name || "",
        quantitySold: item._sum.quantity || 0,
        revenue: item._sum.totalPrice || 0,
      };
    }),
  });
}
