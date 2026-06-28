import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const reports = await prisma.report.findMany({
    where: { orgId: user.orgId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ reports });
}

export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { type, name } = body;

  if (!type || !name) {
    return NextResponse.json({ error: "Type and name are required" }, { status: 400 });
  }

  const report = await prisma.report.create({
    data: {
      orgId: user.orgId,
      type,
      name,
      status: "generating",
    },
  });

  const [txCount, txSum, agentCount, taskCount, approvalCount] = await Promise.all([
    prisma.transaction.count({ where: { orgId: user.orgId } }),
    prisma.transaction.aggregate({ where: { orgId: user.orgId, status: "COMPLETED" }, _sum: { amount: true } }),
    prisma.agent.count({ where: { orgId: user.orgId } }),
    prisma.task.count({ where: { orgId: user.orgId } }),
    prisma.approval.count({ where: { orgId: user.orgId } }),
  ]);

  const reportData = {
    generatedAt: new Date().toISOString(),
    period: "Last 30 days",
    summary: {
      totalTransactions: txCount,
      totalSpend: txSum._sum.amount || 0,
      activeAgents: agentCount,
      tasksCompleted: taskCount,
      approvalsProcessed: approvalCount,
    },
  };

  const updated = await prisma.report.update({
    where: { id: report.id },
    data: { status: "ready", data: reportData },
  });

  return NextResponse.json({ report: updated }, { status: 201 });
}
