// app/api/expenses/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const category = searchParams.get("category");
  const from = searchParams.get("from");
  const to   = searchParams.get("to");

  const where: Record<string, unknown> = {};
  if (category) where.category = category;
  if (from || to) {
    where.date = {
      ...(from && { gte: new Date(from) }),
      ...(to   && { lte: new Date(to + "T23:59:59.999Z") }),
    };
  }

  const [expenses, total, aggregate] = await Promise.all([
    prisma.expense.findMany({
      where,
      include: { user: { select: { name: true } } },
      orderBy: { date: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.expense.count({ where }),
    prisma.expense.aggregate({ where, _sum: { amount: true } }),
  ]);

  return NextResponse.json({
    data: expenses,
    total: aggregate._sum.amount || 0,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}

export async function POST(req: NextRequest) {
  const userId = req.headers.get("x-user-id")!;
  const { category, amount, description, date } = await req.json();
  if (!category || !amount || !date) {
    return NextResponse.json({ error: "Category, amount, and date required" }, { status: 400 });
  }
  const expense = await prisma.expense.create({
    data: {
      category,
      amount: Number(amount),
      description,
      date: new Date(date),
      createdBy: userId,
    },
  });
  return NextResponse.json({ data: expense }, { status: 201 });
}
