import { prisma } from "@/lib/prisma";

const COMMAND_AGENT_MAP: Record<string, string> = {
  allocate_budget: "Budget Agent",
  optimize_costs: "Budget Agent",
  record_api_cost: "API Cost Agent",
  show_api_costs: "API Cost Agent",
  create_vendor: "Procurement Agent",
  create_api_service: "Procurement Agent",
  list_vendors: "Procurement Agent",
  list_services: "Procurement Agent",
  generate_report: "Reporting Agent",
  run_test: "Budget Agent",
  check_status: "Treasury Agent",
  list_wallets: "Treasury Agent",
  list_agents: "Budget Agent",
};

export async function routeTask(orgId: string, commandType: string): Promise<string | null> {
  const agentName = COMMAND_AGENT_MAP[commandType];
  if (!agentName) return null;

  const agent = await prisma.agent.findFirst({
    where: { orgId, name: agentName, status: "active" },
    select: { id: true },
  });

  return agent?.id || null;
}

export async function updateAgentActivity(agentId: string, success: boolean, durationMs: number, error?: string) {
  const now = new Date();
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  await prisma.agent.update({
    where: { id: agentId },
    data: {
      lastActivityAt: now,
      ...(error && { lastError: error }),
    },
  });

  await prisma.agentMetric.upsert({
    where: { agentId_period_periodStart: { agentId, period: "daily", periodStart: dayStart } },
    create: {
      agentId,
      orgId: (await prisma.agent.findUnique({ where: { id: agentId }, select: { orgId: true } }))!.orgId,
      period: "daily",
      periodStart: dayStart,
      successCount: success ? 1 : 0,
      failureCount: success ? 0 : 1,
      totalDuration: durationMs,
      taskCount: 1,
    },
    update: {
      successCount: { increment: success ? 1 : 0 },
      failureCount: { increment: success ? 0 : 1 },
      totalDuration: { increment: durationMs },
      taskCount: { increment: 1 },
    },
  });
}

export async function computeAgentHealth(agentId: string): Promise<number> {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const metrics = await prisma.agentMetric.findMany({
    where: { agentId, periodStart: { gte: since } },
  });

  if (metrics.length === 0) return 100;

  const totalSuccess = metrics.reduce((s, m) => s + m.successCount, 0);
  const totalFail = metrics.reduce((s, m) => s + m.failureCount, 0);
  const total = totalSuccess + totalFail;

  if (total === 0) return 100;
  return Math.round((totalSuccess / total) * 100);
}
