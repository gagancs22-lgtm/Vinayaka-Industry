// app/api/expenses/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { expense } from '@/lib/db/schema'
import { desc, and, gte, lte } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    let expenses = await db
      .select()
      .from(expense)
      .orderBy(desc(expense.createdAt))
      .limit(100)

    // Filter in memory
    if (category) {
      expenses = expenses.filter(e => e.category === category)
    }

    if (from || to) {
      const startDate = from ? new Date(from) : undefined
      const endDate = to ? new Date(to) : undefined
      expenses = expenses.filter(e => {
        if (startDate && e.date < startDate) return false
        if (endDate && e.date > endDate) return false
        return true
      })
    }

    const total = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount.toString()), 0)
    return NextResponse.json({ data: expenses, total })
  } catch (error) {
    console.error('Error fetching expenses:', error)
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { category, amount, description, date, paymentMethod, status } = body

    if (!category || !amount || !date) {
      return NextResponse.json({ error: 'Category, amount, and date required' }, { status: 400 })
    }

    const newExpense = await db
      .insert(expense)
      .values({
        id: `exp-${Date.now()}`,
        expenseNumber: `EXP-${Date.now()}`,
        category,
        amount: parseFloat(amount),
        description,
        date: new Date(date),
        paymentMethod: paymentMethod || 'CASH',
        status: status || 'APPROVED',
        createdBy: 'admin-1',
      })
      .returning()

    return NextResponse.json({ data: newExpense[0] }, { status: 201 })
  } catch (error) {
    console.error('Error creating expense:', error)
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 })
  }
}
