// app/api/notifications/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const unread = searchParams.get("unread") === "true";

  const notifications = await prisma.notification.findMany({
    where: unread ? { status: "UNREAD" } : undefined,
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ data: notifications });
}

export async function PUT(req: NextRequest) {
  const { ids } = await req.json();
  await prisma.notification.updateMany({
    where: { id: { in: ids } },
    data: { status: "READ" },
  });
  return NextResponse.json({ success: true });
}
