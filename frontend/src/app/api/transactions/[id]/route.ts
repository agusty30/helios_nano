import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { JsonRpcProvider } from "ethers";

const ARC_RPC = process.env.ARC_RPC_URL || "https://rpc-testnet.arcology.network";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const transaction = await prisma.transaction.findFirst({
    where: { id, orgId: user.orgId },
    include: {
      wallet: { select: { id: true, label: true, address: true } },
      fromWallet: { select: { id: true, label: true, address: true } },
      toWallet: { select: { id: true, label: true, address: true } },
    },
  });

  if (!transaction) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  }

  let agentName: string | null = null;
  const lookupWalletId = transaction.fromWalletId || transaction.walletId;
  if (lookupWalletId) {
    const agent = await prisma.agent.findFirst({
      where: { walletId: lookupWalletId, orgId: user.orgId },
      select: { name: true },
    });
    if (agent) agentName = agent.name;
  }

  let onChain: { gasUsed?: string; blockNumber?: number; gasPrice?: string } | null = null;
  if (transaction.txHash) {
    try {
      const provider = new JsonRpcProvider(ARC_RPC);
      const [receipt, tx] = await Promise.all([
        provider.getTransactionReceipt(transaction.txHash),
        provider.getTransaction(transaction.txHash),
      ]);
      if (receipt) {
        onChain = {
          gasUsed: receipt.gasUsed.toString(),
          blockNumber: receipt.blockNumber,
          gasPrice: tx?.gasPrice?.toString() || undefined,
        };
      }
    } catch {
      // RPC may be unavailable — return without on-chain data
    }
  }

  return NextResponse.json({
    transaction,
    agentName,
    onChain,
  });
}
