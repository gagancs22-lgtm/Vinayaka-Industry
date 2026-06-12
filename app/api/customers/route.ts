import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { customer, customerLedger } from '@/lib/db/schema'
import { desc, ilike } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''

    let query = db.select().from(customer)

    if (search) {
      query = query.where(ilike(customer.name, `%${search}%`))
    }

    const customers = await query.orderBy(customer.name).limit(100)

    return NextResponse.json({ data: customers })
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, phone, customerType, address, city, state } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name required' }, { status: 400 })
    }

    const newCustomer = await db
      .insert(customer)
      .values({
        id: `cust-${Date.now()}`,
        name: name.trim(),
        email,
        phone,
        customerType: customerType || 'RETAIL',
        address,
        city,
        state,
      })
      .returning()

    // Create ledger entry
    await db
      .insert(customerLedger)
      .values({
        id: `ledger-${Date.now()}`,
        customerId: newCustomer[0].id,
        totalPurchases: 0,
        paidAmount: 0,
        outstandingAmount: 0,
      })

    return NextResponse.json({ data: newCustomer[0] }, { status: 201 })
  } catch (error) {
    console.error('Error creating customer:', error)
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 })
  }
}
