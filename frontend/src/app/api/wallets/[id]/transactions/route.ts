import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleAuthError } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const wallet = await prisma.wallet.findFirst({
      where: { id, orgId: user.orgId },
    });

    if (!wallet) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");

    const where = {
      orgId: user.orgId,
      OR: [
        { walletId: id },
        { fromWalletId: id },
        { toWalletId: id },
      ],
    };

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.transaction.count({ where }),
    ]);

    return NextResponse.json({ transactions, total, walletId: id });
  } catch (err) {
    return handleAuthError(err);
  }
}
