import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    transactions,
    agents,
    taskStats,
    walletCount,
    pendingApprovals,
  ] = await Promise.all([
    prisma.transaction.findMany({
      where: { orgId: user.orgId, createdAt: { gte: thirtyDaysAgo } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.agent.findMany({ where: { orgId: user.orgId } }),
    prisma.task.groupBy({
      by: ["status"],
      where: { orgId: user.orgId },
      _count: true,
    }),
    prisma.wallet.count({ where: { orgId: user.orgId } }),
    prisma.approval.count({ where: { orgId: user.orgId, status: "pending" } }),
  ]);

  const completedTx = transactions.filter(t => t.status === "COMPLETED");
  const totalSpend = completedTx.reduce((s, t) => s + t.amount, 0);
  const activeAgents = agents.filter(a => a.status === "active").length;
  const totalTasks = taskStats.reduce((s, g) => s + g._count, 0);
  const completedTasks = taskStats.find(g => g.status === "COMPLETED")?._count || 0;

  const spendByCategory: Record<string, number> = {};
  for (const tx of completedTx) {
    const meta = tx.metadata as Record<string, unknown>;
    const cat = (meta?.department as string) || tx.type || "Other";
    spendByCategory[cat] = (spendByCategory[cat] || 0) + tx.amount;
  }

  const costBreakdown = Object.entries(spendByCategory).map(([category, amount]) => ({
    category,
    amount,
    percentage: totalSpend > 0 ? Math.round((amount / totalSpend) * 100) : 0,
  }));

  const recentActivity = transactions.slice(0, 10).map(tx => ({
    id: tx.id,
    action: tx.type,
    detail: `${tx.currency} ${tx.amount.toFixed(4)} — ${tx.status.toLowerCase()}`,
    timestamp: tx.createdAt.toISOString(),
    type: tx.status === "COMPLETED" ? "success" : tx.status === "FAILED" ? "warning" : "info",
  }));

  return NextResponse.json({
    kpis: {
      totalSpend,
      transactionCount: transactions.length,
      activeAgents,
      totalAgents: agents.length,
      walletCount,
      pendingApprovals,
      totalTasks,
      completedTasks,
    },
    costBreakdown,
    recentActivity,
    agents: agents.map(a => ({
      id: a.id,
      name: a.name,
      type: a.type,
      status: a.status,
      createdAt: a.createdAt.toISOString(),
    })),
  });
}
