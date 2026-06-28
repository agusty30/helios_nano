import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleAuthError } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const agent = await prisma.agent.findFirst({
      where: { id, orgId: user.orgId },
      select: { id: true },
    });
    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "7");
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const metrics = await prisma.agentMetric.findMany({
      where: { agentId: id, periodStart: { gte: since } },
      orderBy: { periodStart: "asc" },
    });

    const totals = metrics.reduce(
      (acc, m) => ({
        successCount: acc.successCount + m.successCount,
        failureCount: acc.failureCount + m.failureCount,
        totalDuration: acc.totalDuration + m.totalDuration,
        taskCount: acc.taskCount + m.taskCount,
        retryCount: acc.retryCount + m.retryCount,
      }),
      { successCount: 0, failureCount: 0, totalDuration: 0, taskCount: 0, retryCount: 0 }
    );

    const successRate = totals.taskCount > 0
      ? Math.round((totals.successCount / totals.taskCount) * 100)
      : 100;
    const avgDuration = totals.taskCount > 0
      ? Math.round(totals.totalDuration / totals.taskCount)
      : 0;

    return NextResponse.json({
      metrics,
      summary: { ...totals, successRate, avgDuration, days },
    });
  } catch (err) {
    return handleAuthError(err);
  }
}
