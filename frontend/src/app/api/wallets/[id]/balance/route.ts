import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleAuthError } from "@/lib/session";
import { prisma } from "@/lib/prisma";

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

    const rpcUrl = "https://rpc-gel-sepolia.inkonchain.com";

    try {
      const usdcContract = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
      const balanceOfSelector = "0x70a08231";
      const paddedAddress = wallet.address.slice(2).padStart(64, "0");

      const response = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_call",
          params: [{ to: usdcContract, data: `${balanceOfSelector}${paddedAddress}` }, "latest"],
          id: 1,
        }),
      });

      const data = await response.json();
      if (data.result) {
        const rawBalance = BigInt(data.result);
        const balance = Number(rawBalance) / 1e6;
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
