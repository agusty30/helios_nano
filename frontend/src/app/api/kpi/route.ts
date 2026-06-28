import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleAuthError } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "daily";
    const days = parseInt(searchParams.get("days") || "30");
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [transactions, tasks, agents, apiUsages, wallets] = await Promise.all([
      prisma.transaction.findMany({
        where: { orgId: user.orgId, createdAt: { gte: since }, status: "COMPLETED" },
        select: { amount: true, createdAt: true },
      }),
      prisma.task.findMany({
        where: { orgId: user.orgId, createdAt: { gte: since } },
        select: { status: true, executionTimeMs: true, cost: true },
      }),
      prisma.agent.findMany({
        where: { orgId: user.orgId },
        select: { status: true },
      }),
      prisma.apiUsage.findMany({
        where: { orgId: user.orgId, date: { gte: since } },
        select: { cost: true, requests: true },
      }),
      prisma.wallet.count({ where: { orgId: user.orgId, deletedAt: null } }),
    ]);

    const totalPayments = transactions.length;
    const totalVolume = transactions.reduce((s, t) => s + t.amount, 0);
    const avgTransactionSize = totalPayments > 0 ? totalVolume / totalPayments : 0;

    const completedTasks = tasks.filter(t => t.status === "COMPLETED");
    const failedTasks = tasks.filter(t => t.status === "FAILED");
    const taskSuccessRate = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 100;
    const costPerTask = completedTasks.length > 0
      ? completedTasks.reduce((s, t) => s + t.cost, 0) / completedTasks.length
      : 0;
    const avgExecutionTime = completedTasks.length > 0
      ? completedTasks.reduce((s, t) => s + (t.executionTimeMs || 0), 0) / completedTasks.length
      : 0;

    const activeAgents = agents.filter(a => a.status === "active").length;
    const totalApiCost = apiUsages.reduce((s, u) => s + u.cost, 0);
    const totalApiCalls = apiUsages.reduce((s, u) => s + u.requests, 0);

    const budgetEfficiency = totalVolume > 0
      ? Math.min(100, ((totalVolume - totalApiCost) / totalVolume) * 100)
      : 100;

    const current = {
      totalPayments,
      totalVolume,
      avgTransactionSize,
      budgetEfficiency,
      costPerTask,
      taskSuccessRate,
      totalAgentExecutions: tasks.length,
      estimatedSavings: totalApiCost * 0.15,
      activeAgents,
      avgExecutionTime,
      totalApiCost,
      totalApiCalls,
      wallets,
    };

    const snapshots = await prisma.kpiSnapshot.findMany({
      where: { orgId: user.orgId, periodStart: { gte: since } },
      orderBy: { periodStart: "asc" },
    });

    return NextResponse.json({ current, history: snapshots, period, days });
  } catch (err) {
    return handleAuthError(err);
  }
}
