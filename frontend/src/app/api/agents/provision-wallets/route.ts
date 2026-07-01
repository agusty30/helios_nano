import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Wallet } from "ethers";
import { encryptPrivateKey } from "@/lib/crypto";

export async function POST() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin role required" }, { status: 403 });
  }

  const agents = await prisma.agent.findMany({
    where: { orgId: user.orgId },
    select: { id: true, name: true, walletId: true },
  });

  const provisioned: { agentName: string; walletAddress: string }[] = [];
  const alreadyAssigned: { agentName: string; walletAddress: string }[] = [];

  for (const agent of agents) {
    if (agent.walletId) {
      const existing = await prisma.wallet.findUnique({
        where: { id: agent.walletId },
        select: { address: true },
      });
      alreadyAssigned.push({
        agentName: agent.name,
        walletAddress: existing?.address || "unknown",
      });
      continue;
    }

    const ethWallet = Wallet.createRandom();
    const encrypted = encryptPrivateKey(ethWallet.privateKey);

    const wallet = await prisma.wallet.create({
      data: {
        orgId: user.orgId,
        label: `${agent.name} Wallet`,
        address: ethWallet.address,
        type: "AGENT",
        encryptedPrivateKey: encrypted,
      },
    });

    await prisma.agent.update({
      where: { id: agent.id },
      data: { walletId: wallet.id },
    });

    await prisma.auditLog.create({
      data: {
        orgId: user.orgId,
        userId: user.id,
        action: "provision-wallet",
        entity: "Agent",
        entityId: agent.id,
        after: { agentName: agent.name, walletId: wallet.id, walletAddress: ethWallet.address },
      },
    });

    provisioned.push({ agentName: agent.name, walletAddress: ethWallet.address });
  }

  return NextResponse.json({ provisioned, alreadyAssigned });
}
