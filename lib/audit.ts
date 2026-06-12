// lib/audit.ts
import { db } from "@/lib/db"
import { auditLog } from "@/lib/db/schema"

interface AuditParams {
  userId: string
  action: string
  module: string
  entityId?: string
  oldValue?: unknown
  newValue?: unknown
  ipAddress?: string
}

export async function createAuditLog(params: AuditParams) {
  try {
    await db
      .insert(auditLog)
      .values({
        id: `audit-${Date.now()}`,
        userId: params.userId,
        action: params.action,
        module: params.module,
        entityId: params.entityId,
        oldValue: params.oldValue ? JSON.stringify(params.oldValue) : null,
        newValue: params.newValue ? JSON.stringify(params.newValue) : null,
        createdAt: new Date(),
      })
  } catch (err) {
    // Audit logging should never break the main flow
    console.error("Audit log failed:", err)
  }
}

// ─── lib/invoice.ts ───────────────────────────────────────────────────────────

// lib/invoice.ts
import { prisma as db } from "@/lib/db";

export async function generateInvoiceNumber(): Promise<string> {
  // Atomic increment to avoid race conditions
  const settings = await db.settings.findFirst();

  if (!settings) {
    throw new Error("Settings not configured");
  }

  const updated = await db.settings.update({
    where: { id: settings.id },
    data: { invoiceCounter: { increment: 1 } },
  });

  const year = new Date().getFullYear();
  const counter = String(updated.invoiceCounter).padStart(6, "0");
  return `${updated.invoicePrefix}-${year}-${counter}`;
}
