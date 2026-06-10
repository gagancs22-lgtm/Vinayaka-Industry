// lib/notifications.ts
import { prisma } from "@/lib/db";

export async function checkLowStockAlerts(variantIds: string[]) {
  const variants = await prisma.productVariant.findMany({
    where: { id: { in: variantIds } },
    include: { product: { select: { name: true } } },
  });

  for (const variant of variants) {
    if (variant.stock === 0) {
      await upsertNotification(
        `out-stock-${variant.id}`,
        "OUT_OF_STOCK",
        "Out of Stock",
        `${variant.product.name} (${variant.name}) is out of stock`,
        variant.id
      );
    } else if (variant.stock <= variant.minStock) {
      await upsertNotification(
        `low-stock-${variant.id}`,
        "LOW_STOCK",
        "Low Stock Alert",
        `${variant.product.name} (${variant.name}) is running low — only ${variant.stock} left`,
        variant.id
      );
    }
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
