// app/api/audit-logs/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auditLog, user } from '@/lib/db/schema'
import { desc, and, gte, lte, eq } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const startDate = from ? new Date(from) : undefined
    const endDate = to ? new Date(to) : undefined

    const logs = await db
      .select({
        id: auditLog.id,
        userId: auditLog.userId,
        action: auditLog.action,
        module: auditLog.module,
        entityId: auditLog.entityId,
        oldValue: auditLog.oldValue,
        newValue: auditLog.newValue,
        createdAt: auditLog.createdAt,
      })
      .from(auditLog)
      .orderBy(desc(auditLog.createdAt))
      .limit(100)

    // Filter in memory for simplicity
    const filtered = logs.filter(log => {
      if (startDate && log.createdAt < startDate) return false
      if (endDate && log.createdAt > endDate) return false
      return true
    })

    return NextResponse.json({ data: filtered })
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 })
  }
}
