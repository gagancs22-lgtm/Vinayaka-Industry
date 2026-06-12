import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { bill, expense, purchase } from '@/lib/db/schema'
import { gte, lte, and } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const reportType = searchParams.get('type') || 'sales'
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const startDate = from ? new Date(from) : new Date(new Date().getFullYear(), 0, 1)
    const endDate = to ? new Date(to) : new Date()

    const dateRange = [gte(bill.billDate, startDate), lte(bill.billDate, endDate)]

    if (reportType === 'sales') {
      const bills = await db
        .select()
        .from(bill)
        .where(and(...dateRange))
        .limit(1000)

      const total = bills.reduce((sum, b) => sum + parseFloat(b.totalAmount.toString()), 0)

      return NextResponse.json({
        data: {
          type: 'Sales Report',
          period: `${startDate.toDateString()} - ${endDate.toDateString()}`,
          bills,
          total,
          count: bills.length,
        },
      })
    } else if (reportType === 'expenses') {
      const expenses = await db
        .select()
        .from(expense)
        .where(and(gte(expense.date, startDate), lte(expense.date, endDate)))
        .limit(1000)

      const total = expenses.reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0)

      return NextResponse.json({
        data: {
          type: 'Expense Report',
          period: `${startDate.toDateString()} - ${endDate.toDateString()}`,
          expenses,
          total,
          count: expenses.length,
        },
      })
    } else if (reportType === 'purchases') {
      const purchases = await db
        .select()
        .from(purchase)
        .where(gte(purchase.purchaseDate, startDate))
        .limit(1000)

      return NextResponse.json({
        data: {
          type: 'Purchase Report',
          period: `${startDate.toDateString()} - ${endDate.toDateString()}`,
          purchases,
          count: purchases.length,
        },
      })
    }

    return NextResponse.json({ data: [] })
  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}
