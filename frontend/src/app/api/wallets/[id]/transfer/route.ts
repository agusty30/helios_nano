import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole, handleAuthError } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    await requireRole("FINANCE");

    const { id: fromWalletId } = await params;
    const body = await request.json();
    const { toWalletId, amount, note } = body;

    if (!toWalletId || !amount || amount <= 0) {
      return NextResponse.json({ error: "Destination wallet and positive amount are required" }, { status: 400 });
    }

    const [fromWallet, toWallet] = await Promise.all([
      prisma.wallet.findFirst({ where: { id: fromWalletId, orgId: user.orgId } }),
      prisma.wallet.findFirst({ where: { id: toWalletId, orgId: user.orgId } }),
    ]);

    if (!fromWallet) {
      return NextResponse.json({ error: "Source wallet not found" }, { status: 404 });
    }
    if (!toWallet) {
      return NextResponse.json({ error: "Destination wallet not found" }, { status: 404 });
    }
    if (fromWallet.id === toWallet.id) {
      return NextResponse.json({ error: "Cannot transfer to the same wallet" }, { status: 400 });
    }

    const txHash = "0x" + crypto.randomBytes(32).toString("hex");

    const transaction = await prisma.transaction.create({
      data: {
        orgId: user.orgId,
        walletId: fromWalletId,
        fromWalletId,
        toWalletId,
        type: "transfer",
        amount,
        status: "COMPLETED",
        txHash,
        reference: note || `Transfer: ${fromWallet.label} → ${toWallet.label}`,
        metadata: {
          from: { id: fromWallet.id, label: fromWallet.label, address: fromWallet.address },
          to: { id: toWallet.id, label: toWallet.label, address: toWallet.address },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        orgId: user.orgId,
        userId: user.id,
        action: "transfer",
        entity: "Wallet",
        entityId: fromWalletId,
        after: { from: fromWallet.label, to: toWallet.label, amount, txHash },
      },
    });

    return NextResponse.json({
      transaction,
      explorerUrl: `https://testnet.arcscan.app/tx/${txHash}`,
    }, { status: 201 });
  } catch (err) {
    return handleAuthError(err);
  }
}
