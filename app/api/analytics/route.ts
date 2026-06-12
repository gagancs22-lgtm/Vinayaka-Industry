// app/api/analytics/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { bill, billItem, expense, productVariant } from '@/lib/db/schema'
import { gte, lte, eq, and } from 'drizzle-orm'

const EMPTY_DASHBOARD = {
  todayRevenue: 0,
  todayBillCount: 0,
  monthRevenue: 0,
  monthProfit: 0,
  inventoryValue: 0,
  totalProducts: 0,
  lowStockCount: 0,
  outOfStockCount: 0,
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') || 'dashboard'

    if (type === 'dashboard') {
      return getDashboardAnalytics()
    } else if (type === 'sales-trend') {
      return NextResponse.json({ data: [] })
    } else if (type === 'top-products') {
      return getTopProducts()
    }

    return NextResponse.json({ error: 'Unknown analytics type' }, { status: 400 })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json({ data: EMPTY_DASHBOARD })
  }
}

async function getDashboardAnalytics() {
  try {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    // Get today's bills
    const todayBills = await db
      .select()
      .from(bill)
      .where(and(eq(bill.status, 'PAID'), gte(bill.billDate, todayStart)))

    // Get this month's bills
    const monthBills = await db
      .select()
      .from(bill)
      .where(and(eq(bill.status, 'PAID'), gte(bill.billDate, monthStart)))

    // Get all product variants for inventory value
    const allVariants = await db.select().from(productVariant)

    // Get month's expenses
    const monthExpenses = await db
      .select()
      .from(expense)
      .where(gte(expense.date, monthStart))

    const todayRevenue = todayBills.reduce((sum, b) => sum + parseFloat(b.totalAmount.toString()), 0)
    const monthRevenue = monthBills.reduce((sum, b) => sum + parseFloat(b.totalAmount.toString()), 0)
    const inventoryValue = allVariants.reduce((sum, v) => sum + (v.stock * parseFloat(v.purchasePrice.toString())), 0)
    const monthExpenseTotal = monthExpenses.reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0)
    const lowStockCount = allVariants.filter(v => v.stock > 0 && v.stock <= (v.minStock || 5)).length
    const outOfStockCount = allVariants.filter(v => v.stock === 0).length

    return NextResponse.json({
      data: {
        todayRevenue,
        todayBillCount: todayBills.length,
        monthRevenue,
        monthProfit: monthRevenue - monthExpenseTotal,
        inventoryValue,
        totalProducts: allVariants.length,
        lowStockCount,
        outOfStockCount,
      },
    })
  } catch (error) {
    console.error('Dashboard analytics error:', error)
    return NextResponse.json({ data: EMPTY_DASHBOARD })
  }
}

async function getTopProducts() {
  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const topItems = await db
      .select()
      .from(billItem)
      .where(gte(billItem.createdAt, thirtyDaysAgo))
      .limit(10)

    return NextResponse.json({
      data: topItems.map(item => ({
        variantId: item.variantId,
        productName: item.variantId,
        quantitySold: item.quantity,
        revenue: item.total,
      })),
    })
  } catch (error) {
    console.error('Top products error:', error)
    return NextResponse.json({ data: [] })
  }
}
