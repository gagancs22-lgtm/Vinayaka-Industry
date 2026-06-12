// app/api/suppliers/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { supplier } from '@/lib/db/schema'
import { desc, ilike } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''

    let query = db
      .select()
      .from(supplier)

    if (search) {
      query = query.where(ilike(supplier.name, `%${search}%`))
    }

    const suppliers = await query
      .orderBy(supplier.name)
      .limit(100)

    return NextResponse.json({ data: suppliers })
  } catch (error) {
    console.error('Error fetching suppliers:', error)
    return NextResponse.json({ error: 'Failed to fetch suppliers' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, phone, address, city, state } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name required' }, { status: 400 })
    }

    const newSupplier = await db
      .insert(supplier)
      .values({
        id: `supp-${Date.now()}`,
        name: name.trim(),
        email,
        phone,
        address,
        city,
        state,
      })
      .returning()

    return NextResponse.json({ data: newSupplier[0] }, { status: 201 })
  } catch (error) {
    console.error('Error creating supplier:', error)
    return NextResponse.json({ error: 'Failed to create supplier' }, { status: 500 })
  }
}
