// app/api/audit-logs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page   = parseInt(searchParams.get("page")   || "1");
  const limit  = parseInt(searchParams.get("limit")  || "30");
  const module = searchParams.get("module");
  const from   = searchParams.get("from");
  const to     = searchParams.get("to");

  const where: Record<string, unknown> = {};
  if (module) where.module = module;
  if (from || to) {
    where.createdAt = {
      ...(from && { gte: new Date(from) }),
      ...(to   && { lte: new Date(to + "T23:59:59.999Z") }),
    };
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { name: true, email: true, role: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return NextResponse.json({
    data: logs,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}
