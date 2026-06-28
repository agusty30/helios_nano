import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const [userCount, orgCount, taskCount, transactionCount, agentCount, walletCount, vendorCount, serviceCount] = await Promise.all([
    prisma.user.count(),
    prisma.organization.count(),
    prisma.task.count(),
    prisma.transaction.count(),
    prisma.agent.count(),
    prisma.wallet.count(),
    prisma.vendor.count(),
    prisma.apiService.count(),
  ]);

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    counts: { users: userCount, organizations: orgCount, tasks: taskCount, transactions: transactionCount, agents: agentCount, wallets: walletCount, vendors: vendorCount, apiServices: serviceCount },
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    node: process.version,
  });
}
