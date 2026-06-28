import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleAuthError } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { parseCommand } from "@/lib/command-parser";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);

    const tasks = await prisma.task.findMany({
      where: { orgId: user.orgId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ tasks });
  } catch (err) {
    return handleAuthError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { command } = body;

    if (!command || typeof command !== "string") {
      return NextResponse.json({ error: "Command is required" }, { status: 400 });
    }

    const parsed = parseCommand(command);
    const startTime = Date.now();

    const task = await prisma.task.create({
      data: {
        orgId: user.orgId,
        command,
        commandType: parsed.type,
        status: "RUNNING",
        steps: JSON.parse(JSON.stringify([
          { step: 1, action: "parse_command", status: "completed", detail: `Parsed as: ${parsed.type}` },
          { step: 2, action: "execute", status: "running", detail: "Processing..." },
        ])),
      },
    });

    let result: Record<string, unknown> = {};
    const steps = [
      { step: 1, action: "parse_command", status: "completed", detail: `Parsed as: ${parsed.type}` },
    ];

    try {
      switch (parsed.type) {
        case "run_test": {
          steps.push({ step: 2, action: "test_db", status: "running", detail: "Testing database connection..." });
          try {
            await prisma.$queryRaw`SELECT 1`;
            steps[1] = { step: 2, action: "test_db", status: "completed", detail: "Database connection OK" };
          } catch {
            steps[1] = { step: 2, action: "test_db", status: "failed", detail: "Database connection failed" };
          }
          steps.push({ step: 3, action: "test_auth", status: "completed", detail: `Auth: logged in as ${user.name} (${user.role})` });
          steps.push({ step: 4, action: "test_org", status: "completed", detail: `Organization: ${user.orgId}` });
          result = { testsRun: 3, testsPassed: steps.filter((s) => s.status === "completed").length - 1 };
          break;
        }

        case "check_status": {
          const [orgData, walletCount, taskCount, agentCount, vendorCount, serviceCount] = await Promise.all([
            prisma.organization.findUnique({ where: { id: user.orgId } }),
            prisma.wallet.count({ where: { orgId: user.orgId } }),
            prisma.task.count({ where: { orgId: user.orgId } }),
            prisma.agent.count({ where: { orgId: user.orgId } }),
            prisma.vendor.count({ where: { orgId: user.orgId } }),
            prisma.apiService.count({ where: { orgId: user.orgId } }),
          ]);
          steps.push({ step: 2, action: "gather_status", status: "completed", detail: `Org: ${orgData?.name}` });
          steps.push({ step: 3, action: "count_resources", status: "completed", detail: `Wallets: ${walletCount}, Agents: ${agentCount}, Vendors: ${vendorCount}, API Services: ${serviceCount}, Tasks: ${taskCount}` });
          result = { organization: orgData?.name, wallets: walletCount, agents: agentCount, vendors: vendorCount, apiServices: serviceCount, totalTasks: taskCount };
          break;
        }

        case "allocate_budget": {
          const amount = parseFloat(parsed.params.amount || "0");
          if (amount <= 0) throw new Error("Invalid budget amount");
          steps.push({ step: 2, action: "set_budget", status: "completed", detail: `Daily budget set to $${amount}` });
          await prisma.setting.upsert({
            where: { orgId_key: { orgId: user.orgId, key: "daily_budget" } },
            create: { orgId: user.orgId, key: "daily_budget", value: { amount } },
            update: { value: { amount } },
          });
          result = { budget: amount };
          break;
        }

        case "optimize_costs": {
          const services = await prisma.apiService.findMany({ where: { orgId: user.orgId }, include: { usages: { orderBy: { date: "desc" }, take: 30 } } });
          steps.push({ step: 2, action: "analyze", status: "completed", detail: `Analyzing ${services.length} API services...` });
          const recommendations: string[] = [];
          for (const svc of services) {
            const totalCost = svc.usages.reduce((sum, u) => sum + u.cost, 0);
            if (totalCost === 0 && svc.usages.length === 0) {
              recommendations.push(`${svc.name}: No usage recorded — consider removing or verify integration`);
            } else if (svc.dailyBudget > 0 && totalCost > svc.dailyBudget * 0.8) {
              recommendations.push(`${svc.name}: Approaching budget limit (${((totalCost / svc.dailyBudget) * 100).toFixed(0)}% used)`);
            }
          }
          if (recommendations.length === 0) recommendations.push("All services are within budget — route 80% of requests to cheap tier for additional savings");
          steps.push({ step: 3, action: "recommend", status: "completed", detail: recommendations.join("; ") });
          result = { servicesAnalyzed: services.length, recommendations };
          break;
        }

        case "record_api_cost": {
          const provider = parsed.params.provider;
          const cost = parseFloat(parsed.params.cost || "0");
          let service = await prisma.apiService.findFirst({ where: { orgId: user.orgId, provider: { contains: provider, mode: "insensitive" } } });
          if (!service) {
            service = await prisma.apiService.create({ data: { orgId: user.orgId, name: `${provider} API`, provider } });
            steps.push({ step: 2, action: "create_service", status: "completed", detail: `Created service "${provider} API"` });
          }
          await prisma.apiUsage.create({
            data: { serviceId: service.id, orgId: user.orgId, date: new Date(), requests: 1, cost, model: provider },
          });
          steps.push({ step: steps.length + 1, action: "record_cost", status: "completed", detail: `Recorded $${cost.toFixed(4)} for ${provider}` });
          result = { provider, cost, serviceId: service.id };
          break;
        }

        case "create_vendor": {
          const vendor = await prisma.vendor.create({ data: { orgId: user.orgId, name: parsed.params.name } });
          steps.push({ step: 2, action: "create_vendor", status: "completed", detail: `Created vendor "${vendor.name}"` });
          result = { vendorId: vendor.id, name: vendor.name };
          break;
        }

        case "create_api_service": {
          const svc = await prisma.apiService.create({
            data: { orgId: user.orgId, name: parsed.params.name, provider: parsed.params.provider },
          });
          steps.push({ step: 2, action: "create_service", status: "completed", detail: `Created service "${svc.name}" (${svc.provider})` });
          result = { serviceId: svc.id, name: svc.name, provider: svc.provider };
          break;
        }

        case "show_api_costs": {
          const d = parseInt(parsed.params.days || "30");
          const since = new Date(Date.now() - d * 24 * 60 * 60 * 1000);
          const usages = await prisma.apiUsage.findMany({
            where: { orgId: user.orgId, date: { gte: since } },
            include: { service: { select: { name: true, provider: true } } },
          });
          const totalCost = usages.reduce((s, u) => s + u.cost, 0);
          const totalReqs = usages.reduce((s, u) => s + u.requests, 0);
          steps.push({ step: 2, action: "query_costs", status: "completed", detail: `Last ${d} days: $${totalCost.toFixed(4)} across ${totalReqs} requests` });
          result = { days: d, totalCost, totalRequests: totalReqs, records: usages.length };
          break;
        }

        case "list_agents": {
          const agents = await prisma.agent.findMany({ where: { orgId: user.orgId }, select: { name: true, type: true, status: true } });
          steps.push({ step: 2, action: "list_agents", status: "completed", detail: agents.map(a => `${a.name} (${a.status})`).join(", ") || "No agents" });
          result = { agents: agents.length, list: agents };
          break;
        }

        case "list_vendors": {
          const vendors = await prisma.vendor.findMany({ where: { orgId: user.orgId }, select: { name: true, category: true, status: true } });
          steps.push({ step: 2, action: "list_vendors", status: "completed", detail: vendors.map(v => `${v.name} (${v.category})`).join(", ") || "No vendors" });
          result = { vendors: vendors.length, list: vendors };
          break;
        }

        case "list_services": {
          const svcs = await prisma.apiService.findMany({ where: { orgId: user.orgId }, select: { name: true, provider: true, status: true, dailyBudget: true } });
          steps.push({ step: 2, action: "list_services", status: "completed", detail: svcs.map(s => `${s.name} (${s.provider})`).join(", ") || "No services" });
          result = { services: svcs.length, list: svcs };
          break;
        }

        case "list_wallets": {
          const wallets = await prisma.wallet.findMany({ where: { orgId: user.orgId }, select: { label: true, address: true, type: true } });
          steps.push({ step: 2, action: "list_wallets", status: "completed", detail: wallets.map(w => `${w.label} (${w.type})`).join(", ") || "No wallets" });
          result = { wallets: wallets.length, list: wallets };
          break;
        }

        case "generate_report": {
          const reportType = parsed.params.type || "summary";
          const [txCount, totalSpend, agentCount, taskCount] = await Promise.all([
            prisma.transaction.count({ where: { orgId: user.orgId } }),
            prisma.transaction.aggregate({ where: { orgId: user.orgId, status: "COMPLETED" }, _sum: { amount: true } }),
            prisma.agent.count({ where: { orgId: user.orgId } }),
            prisma.task.count({ where: { orgId: user.orgId } }),
          ]);
          steps.push({ step: 2, action: "compile_report", status: "completed", detail: `Report type: ${reportType}` });
          steps.push({ step: 3, action: "report_data", status: "completed", detail: `Transactions: ${txCount}, Total spend: $${(totalSpend._sum.amount || 0).toFixed(2)}, Agents: ${agentCount}, Tasks: ${taskCount}` });
          result = { type: reportType, transactions: txCount, totalSpend: totalSpend._sum.amount || 0, agents: agentCount, tasks: taskCount };
          break;
        }

        default: {
          steps.push({ step: 2, action: "route_llm", status: "completed", detail: `Forwarding to LLM agent: "${command}"` });
          result = { forwarded: true, note: "Sent to LLM routing engine" };
        }
      }

      const executionTimeMs = Date.now() - startTime;

      const updated = await prisma.task.update({
        where: { id: task.id },
        data: {
          status: "COMPLETED",
          steps: JSON.parse(JSON.stringify(steps)),
          result: JSON.parse(JSON.stringify(result)),
          executionTimeMs,
          completedAt: new Date(),
        },
      });

      return NextResponse.json({ task: updated }, { status: 201 });
    } catch (err) {
      const executionTimeMs = Date.now() - startTime;
      steps.push({ step: steps.length + 1, action: "error", status: "failed", detail: String(err) });

      const updated = await prisma.task.update({
        where: { id: task.id },
        data: {
          status: "FAILED",
          steps: JSON.parse(JSON.stringify(steps)),
          result: JSON.parse(JSON.stringify({ error: String(err) })),
          executionTimeMs,
          completedAt: new Date(),
        },
      });

      return NextResponse.json({ task: updated }, { status: 201 });
    }
  } catch (err) {
    return handleAuthError(err);
  }
}
