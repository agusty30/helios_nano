import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleAuthError } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const ARC_TESTNET_RPC = process.env.ARC_TESTNET_RPC
  || "https://rpc.testnet.arc-node.thecanteenapp.com/v1/swrm_3aa8a9334770e6eddb5cc05f2e3dbfe555eca270d4eb78fbb4b6056a4a04e2b0";

export async function GET(
  _request: NextRequest,
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

    try {
      const response = await fetch(ARC_TESTNET_RPC, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_getBalance",
          params: [wallet.address, "latest"],
          id: 1,
        }),
      });

      const data = await response.json();
      if (data.result) {
        const rawBalance = BigInt(data.result);
        const balance = Number(rawBalance) / 1e18;
        return NextResponse.json({ walletId: id, address: wallet.address, balance, chain: wallet.chain });
      }

      return NextResponse.json({ walletId: id, address: wallet.address, balance: 0, chain: wallet.chain, note: "Could not query balance" });
    } catch {
      return NextResponse.json({ walletId: id, address: wallet.address, balance: 0, chain: wallet.chain, note: "RPC query failed" });
    }
  } catch (err) {
    return handleAuthError(err);
  }
}
