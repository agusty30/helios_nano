import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole, handleAuthError } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { decryptPrivateKey } from "@/lib/crypto";

const ARC_TESTNET_RPC =
  "https://rpc.testnet.arc-node.thecanteenapp.com/v1/swrm_3aa8a9334770e6eddb5cc05f2e3dbfe555eca270d4eb78fbb4b6056a4a04e2b0";

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
    if (!fromWallet.encryptedPrivateKey) {
      return NextResponse.json({ error: "Source wallet has no private key — cannot sign transactions. Import a wallet with a private key first." }, { status: 400 });
    }

    const { ethers } = await import("ethers");

    let privateKey: string;
    try {
      privateKey = decryptPrivateKey(fromWallet.encryptedPrivateKey);
    } catch {
      return NextResponse.json({ error: "Failed to decrypt source wallet private key" }, { status: 500 });
    }

    const provider = new ethers.JsonRpcProvider(ARC_TESTNET_RPC, {
      chainId: 5042002,
      name: "arc-testnet",
    });
    const signer = new ethers.Wallet(privateKey, provider);

    const amountWei = ethers.parseEther(String(amount));

    let txHash: string;
    try {
      const tx = await signer.sendTransaction({
        to: toWallet.address,
        value: amountWei,
      });
      txHash = tx.hash;
      await tx.wait(1);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      const transaction = await prisma.transaction.create({
        data: {
          orgId: user.orgId,
          walletId: fromWalletId,
          fromWalletId,
          toWalletId,
          type: "transfer",
          amount,
          status: "FAILED",
          reference: note || `Transfer: ${fromWallet.label} → ${toWallet.label}`,
          metadata: {
            from: { id: fromWallet.id, label: fromWallet.label, address: fromWallet.address },
            to: { id: toWallet.id, label: toWallet.label, address: toWallet.address },
            error: message,
          },
        },
      });
      return NextResponse.json({
        error: `On-chain transfer failed: ${message}`,
        transaction,
      }, { status: 502 });
    }

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
