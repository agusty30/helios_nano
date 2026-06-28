import { NextResponse } from "next/server";
import { requireAuth, handleAuthError } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await requireAuth();
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const agents = await prisma.agent.findMany({
      where: { orgId: user.orgId },
      include: {
        _count: { select: { tasks: true } },
        metrics: {
          where: { periodStart: { gte: since } },
          orderBy: { periodStart: "desc" },
        },
      },
    });

    const leaderboard = agents.map(agent => {
      const totalSuccess = agent.metrics.reduce((s, m) => s + m.successCount, 0);
      const totalFail = agent.metrics.reduce((s, m) => s + m.failureCount, 0);
      const totalDuration = agent.metrics.reduce((s, m) => s + m.totalDuration, 0);
      const totalTasks = totalSuccess + totalFail;
      const successRate = totalTasks > 0 ? Math.round((totalSuccess / totalTasks) * 100) : 100;
      const avgDuration = totalTasks > 0 ? Math.round(totalDuration / totalTasks) : 0;

      return {
        id: agent.id,
        name: agent.name,
        type: agent.type,
        status: agent.status,
        totalTasks: agent._count.tasks,
        successRate,
        avgDuration,
        totalSuccess,
        totalFail,
        healthScore: agent.healthScore,
      };
    });

    leaderboard.sort((a, b) => b.successRate - a.successRate || b.totalTasks - a.totalTasks);

    return NextResponse.json({ leaderboard });
  } catch (err) {
    return handleAuthError(err);
  }
}
