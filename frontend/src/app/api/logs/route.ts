import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleAuthError } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);

    const severity = searchParams.get("severity");
    const component = searchParams.get("component");
    const taskId = searchParams.get("taskId");
    const correlationId = searchParams.get("correlationId");
    const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 500);
    const offset = parseInt(searchParams.get("offset") || "0");

    const where: Record<string, unknown> = { orgId: user.orgId };
    if (severity) where.severity = severity;
    if (component) where.component = component;
    if (taskId) where.taskId = taskId;
    if (correlationId) where.correlationId = correlationId;

    const [logs, total] = await Promise.all([
      prisma.executionLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.executionLog.count({ where }),
    ]);

    return NextResponse.json({ logs, total, limit, offset });
  } catch (err) {
    return handleAuthError(err);
  }
}
