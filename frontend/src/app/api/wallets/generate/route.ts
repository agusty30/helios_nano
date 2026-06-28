import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole, handleAuthError } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ethers } from "ethers";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    await requireRole("FINANCE");

    const body = await request.json();
    const { label, type } = body;

    if (!label || !type) {
      return NextResponse.json({ error: "Label and type are required" }, { status: 400 });
    }
    if (type !== "TREASURY" && type !== "AGENT") {
      return NextResponse.json({ error: "Type must be TREASURY or AGENT" }, { status: 400 });
    }

    const randomWallet = ethers.Wallet.createRandom();
    const address = randomWallet.address;
    const privateKey = randomWallet.privateKey;

    const wallet = await prisma.wallet.create({
      data: {
        orgId: user.orgId,
        label,
        address,
        type,
      },
    });

    await prisma.auditLog.create({
      data: {
        orgId: user.orgId,
        userId: user.id,
        action: "generate",
        entity: "Wallet",
        entityId: wallet.id,
        after: { label: wallet.label, address: wallet.address, type: wallet.type },
      },
    });

    return NextResponse.json({
      wallet,
      privateKey,
      warning: "Save this private key securely. It will NOT be shown again.",
    }, { status: 201 });
  } catch (err) {
    return handleAuthError(err);
  }
}
