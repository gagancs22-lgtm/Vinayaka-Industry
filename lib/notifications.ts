// lib/notifications.ts
import { db } from "@/lib/db"
import { productVariant } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function checkLowStockAlerts(variantIds: string[]) {
  try {
    // Get variants using Drizzle
    const variants = await db
      .select()
      .from(productVariant)
      .where(/* would need IN operator */)

    for (const variant of variants) {
      if (variant.stock === 0) {
        await upsertNotification(
          `out-stock-${variant.id}`,
          "OUT_OF_STOCK",
          "Out of Stock",
          `Product ${variant.name} is out of stock`,
          variant.id
        );
      } else if (variant.stock <= (variant.minStock || 5)) {
        await upsertNotification(
          `low-stock-${variant.id}`,
          "LOW_STOCK",
          "Low Stock Alert",
          `Product ${variant.name} is running low — only ${variant.stock} left`,
          variant.id
        );
      }
    }
  } catch (error) {
    console.error("Error checking stock alerts:", error)
  }
}

async function upsertNotification(
  key: string,
  type: "LOW_STOCK" | "OUT_OF_STOCK" | "PRICE_CHANGE" | "SYSTEM",
  title: string,
  message: string,
  entityId: string
) {
  // Check if unread notification of this type already exists for this entity
  const existing = await prisma.notification.findFirst({
    where: { entityId, type, status: "UNREAD" },
  });

  if (!existing) {
    await prisma.notification.create({
      data: { type, title, message, entityId, status: "UNREAD" },
    });
  }
}

export async function getUnreadNotifications() {
  return prisma.notification.findMany({
    where: { status: "UNREAD" },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function markNotificationsRead(ids: string[]) {
  return prisma.notification.updateMany({
    where: { id: { in: ids } },
    data: { status: "READ" },
  });
}
