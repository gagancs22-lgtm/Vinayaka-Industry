// lib/audit.ts
import { prisma } from "@/lib/db";

interface AuditParams {
  userId: string;
  action: string;
  module: string;
  entityId?: string;
  oldValue?: unknown;
  newValue?: unknown;
  ipAddress?: string;
}

export async function createAuditLog(params: AuditParams) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        module: params.module,
        entityId: params.entityId,
        oldValue: params.oldValue ? JSON.parse(JSON.stringify(params.oldValue)) : undefined,
        newValue: params.newValue ? JSON.parse(JSON.stringify(params.newValue)) : undefined,
        ipAddress: params.ipAddress,
      },
    });
  } catch (err) {
    // Audit logging should never break the main flow
    console.error("Audit log failed:", err);
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
