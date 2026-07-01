import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
  const offset = parseInt(searchParams.get("offset") || "0");

  const where: Record<string, unknown> = { orgId: user.orgId };
  if (status && status !== "all") where.status = status;
  if (search) {
    where.OR = [
      { type: { contains: search, mode: "insensitive" } },
      { reference: { contains: search, mode: "insensitive" } },
    ];
  }

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      include: {
        wallet: { select: { label: true, address: true } },
        fromWallet: { select: { label: true, address: true } },
        toWallet: { select: { label: true, address: true } },
      },
    }),
    prisma.transaction.count({ where }),
  ]);

  return NextResponse.json({ transactions, total });
}

export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { type, amount, walletId, reference, metadata } = body;

  if (!type || amount === undefined) {
    return NextResponse.json({ error: "Type and amount are required" }, { status: 400 });
  }

  const transaction = await prisma.transaction.create({
    data: {
      orgId: user.orgId,
      type,
      amount,
      walletId: walletId || null,
      reference: reference || null,
      metadata: metadata || {},
    },
  });

  return NextResponse.json({ transaction }, { status: 201 });
}
