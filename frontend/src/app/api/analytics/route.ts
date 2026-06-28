import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [transactions, agents, taskStats] = await Promise.all([
    prisma.transaction.findMany({
      where: { orgId: user.orgId, createdAt: { gte: thirtyDaysAgo } },
    }),
    prisma.agent.findMany({ where: { orgId: user.orgId } }),
    prisma.task.groupBy({
      by: ["status"],
      where: { orgId: user.orgId, createdAt: { gte: thirtyDaysAgo } },
      _count: true,
    }),
  ]);

  const completedTx = transactions.filter(t => t.status === "COMPLETED");
  const totalSpend = completedTx.reduce((s, t) => s + t.amount, 0);
  const totalTasks = taskStats.reduce((s, g) => s + g._count, 0);

  const spendByCategory: Record<string, number> = {};
  const spendByDay: Record<string, number> = {};

  for (const tx of completedTx) {
    const meta = tx.metadata as Record<string, unknown>;
    const cat = (meta?.department as string) || tx.type || "Other";
    spendByCategory[cat] = (spendByCategory[cat] || 0) + tx.amount;

    const day = tx.createdAt.toISOString().slice(0, 10);
    spendByDay[day] = (spendByDay[day] || 0) + tx.amount;
  }

  const costBreakdown = Object.entries(spendByCategory).map(([category, amount]) => ({
    category,
    amount,
    percentage: totalSpend > 0 ? Math.round((amount / totalSpend) * 100) : 0,
  }));

  const spendingTrend = Object.entries(spendByDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, amount]) => ({ date, amount }));

  const agentPerformance = agents.map(a => ({
    id: a.id,
    name: a.name,
    type: a.type,
    status: a.status,
    tasksCompleted: 0,
    totalSpend: 0,
  }));

  return NextResponse.json({
    summary: {
      totalSpend,
      transactionCount: transactions.length,
      completedTransactions: completedTx.length,
      activeAgents: agents.filter(a => a.status === "active").length,
      totalTasks,
    },
    costBreakdown,
    spendingTrend,
    agentPerformance,
  });
}
