// app/api/purchases/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { purchase, purchaseItem, productVariant, supplier } from '@/lib/db/schema'
import { eq, desc, and, gte, lte } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const supplierId = searchParams.get('supplierId')
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    let purchases = await db
      .select({
        id: purchase.id,
        purchaseNumber: purchase.purchaseNumber,
        supplierId: purchase.supplierId,
        purchaseDate: purchase.purchaseDate,
        expectedDelivery: purchase.expectedDelivery,
        status: purchase.status,
        notes: purchase.notes,
        createdAt: purchase.createdAt,
      })
      .from(purchase)
      .orderBy(desc(purchase.createdAt))
      .limit(100)

    // Filter in memory
    if (supplierId) {
      purchases = purchases.filter(p => p.supplierId === supplierId)
    }

    if (from || to) {
      const startDate = from ? new Date(from) : undefined
      const endDate = to ? new Date(to) : undefined
      purchases = purchases.filter(p => {
        if (startDate && p.purchaseDate < startDate) return false
        if (endDate && p.purchaseDate > endDate) return false
        return true
      })
    }

    return NextResponse.json({ data: purchases })
  } catch (error) {
    console.error('Error fetching purchases:', error)
    return NextResponse.json({ error: 'Failed to fetch purchases' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { supplierId, purchaseDate, expectedDelivery, status, notes } = body

    const newPurchase = await db
      .insert(purchase)
      .values({
        id: `purch-${Date.now()}`,
        purchaseNumber: `PO-${Date.now()}`,
        supplierId,
        purchaseDate: new Date(purchaseDate),
        expectedDelivery: expectedDelivery ? new Date(expectedDelivery) : null,
        status: status || 'PENDING',
        notes,
        createdBy: 'admin-1',
      })
      .returning()

    return NextResponse.json({ data: newPurchase[0] }, { status: 201 })
  } catch (error) {
    console.error('Error creating purchase:', error)
    return NextResponse.json({ error: 'Failed to create purchase' }, { status: 500 })
  }
}
