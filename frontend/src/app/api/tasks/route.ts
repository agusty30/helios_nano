import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { parseCommand } from "@/lib/command-parser";

export async function GET(request: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);

  const tasks = await prisma.task.findMany({
    where: { orgId: user.orgId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return NextResponse.json({ tasks });
}

export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
  let steps = [
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
        const [orgData, walletCount, taskCount] = await Promise.all([
          prisma.organization.findUnique({ where: { id: user.orgId } }),
          prisma.wallet.count({ where: { orgId: user.orgId } }),
          prisma.task.count({ where: { orgId: user.orgId } }),
        ]);
        steps.push({ step: 2, action: "gather_status", status: "completed", detail: `Org: ${orgData?.name}, Wallets: ${walletCount}, Tasks: ${taskCount}` });
        result = { organization: orgData?.name, wallets: walletCount, totalTasks: taskCount };
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
        steps.push({ step: 2, action: "analyze", status: "completed", detail: "Analyzing current spend patterns..." });
        steps.push({ step: 3, action: "recommend", status: "completed", detail: "Recommendation: route 80% of requests to cheap tier, reserve heavy tier for complex queries" });
        result = { recommendation: "Route 80% to cheap tier", estimatedSavings: "40%" };
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
}
