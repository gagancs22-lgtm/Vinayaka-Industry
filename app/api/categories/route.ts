// app/api/categories/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ data: categories });
}

export async function POST(req: NextRequest) {
  const userRole = req.headers.get("x-user-role")!;
  if (userRole !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { name, description, color } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });
  const category = await prisma.category.create({ data: { name: name.trim(), description, color } });
  return NextResponse.json({ data: category }, { status: 201 });
}
