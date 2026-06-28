import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Wallet } from "ethers";
import { encryptPrivateKey } from "@/lib/crypto";

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const wallets = await prisma.wallet.findMany({
    where: { orgId: user.orgId, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ wallets });
}

export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN" && user.role !== "FINANCE") {
    return NextResponse.json({ error: "Admin or Finance role required" }, { status: 403 });
  }

  const body = await request.json();
  const { label, address, privateKey, type } = body;

  if (!label) {
    return NextResponse.json({ error: "Label is required" }, { status: 400 });
  }

  let walletAddress = address;
  let encryptedKey: string | null = null;

  if (privateKey) {
    const normalizedKey = privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`;
    if (!/^0x[a-fA-F0-9]{64}$/.test(normalizedKey)) {
      return NextResponse.json({ error: "Invalid private key format" }, { status: 400 });
    }
    try {
      const ethWallet = new Wallet(normalizedKey);
      walletAddress = ethWallet.address;
      encryptedKey = encryptPrivateKey(normalizedKey);
    } catch {
      return NextResponse.json({ error: "Invalid private key" }, { status: 400 });
    }
  } else if (!address) {
    return NextResponse.json({ error: "Either address or privateKey is required" }, { status: 400 });
  }

  const existing = await prisma.wallet.findFirst({
    where: { orgId: user.orgId, address: walletAddress, deletedAt: null },
  });
  if (existing) {
    return NextResponse.json({ error: "Wallet with this address already exists" }, { status: 409 });
  }

  const wallet = await prisma.wallet.create({
    data: {
      orgId: user.orgId,
      label,
      address: walletAddress,
      type: type || "AGENT",
      ...(encryptedKey && { encryptedPrivateKey: encryptedKey }),
    },
  });

  await prisma.auditLog.create({
    data: {
      orgId: user.orgId,
      userId: user.id,
      action: "create",
      entity: "Wallet",
      entityId: wallet.id,
      after: { label: wallet.label, address: wallet.address, type: wallet.type, importedWithKey: !!privateKey },
    },
  });

  return NextResponse.json({
    wallet: {
      id: wallet.id,
      label: wallet.label,
      address: wallet.address,
      type: wallet.type,
      chain: wallet.chain,
      network: wallet.network,
      status: wallet.status,
      isDefault: wallet.isDefault,
      deletedAt: wallet.deletedAt,
      createdAt: wallet.createdAt,
    },
  }, { status: 201 });
}
