import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole, handleAuthError } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { apiUsageCreateSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30", 10);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [services, usages, vendors, budgetRules] = await Promise.all([
      prisma.apiService.findMany({
        where: { orgId: user.orgId },
        include: { vendor: { select: { name: true, logo: true } } },
      }),
      prisma.apiUsage.findMany({
        where: { orgId: user.orgId, date: { gte: since } },
        include: { service: { select: { name: true, provider: true } } },
        orderBy: { date: "asc" },
      }),
      prisma.vendor.findMany({
        where: { orgId: user.orgId },
        select: { id: true, name: true, category: true, logo: true, status: true },
      }),
      prisma.budgetRule.findMany({
        where: { orgId: user.orgId, enabled: true },
      }),
    ]);

    const totalCost = usages.reduce((sum, u) => sum + u.cost, 0);
    const totalRequests = usages.reduce((sum, u) => sum + u.requests, 0);
    const totalTokens = usages.reduce((sum, u) => sum + u.tokens, 0);
    const dailyAvg = days > 0 ? totalCost / days : 0;
    const projectedMonthly = dailyAvg * 30;

    const byProvider: Record<string, { cost: number; requests: number; tokens: number }> = {};
    for (const u of usages) {
      const key = u.service.provider;
      if (!byProvider[key]) byProvider[key] = { cost: 0, requests: 0, tokens: 0 };
      byProvider[key].cost += u.cost;
      byProvider[key].requests += u.requests;
      byProvider[key].tokens += u.tokens;
    }

    const dailyCosts: Record<string, number> = {};
    for (const u of usages) {
      const day = u.date.toISOString().split("T")[0];
      dailyCosts[day] = (dailyCosts[day] || 0) + u.cost;
    }

    const alerts = budgetRules
      .map((rule) => {
        const pct = rule.limit > 0 ? (totalCost / rule.limit) * 100 : 0;
        return { id: rule.id, name: rule.name, limit: rule.limit, spent: totalCost, pct, triggered: pct >= rule.alertThreshold };
      })
      .filter((a) => a.triggered);

    return NextResponse.json({
      summary: { totalCost, totalRequests, totalTokens, dailyAvg, projectedMonthly, days },
      byProvider,
      dailyCosts,
      services,
      vendors,
      alerts,
    });
  } catch (err) {
    return handleAuthError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole("FINANCE");
    const body = await request.json();
    const parsed = apiUsageCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const service = await prisma.apiService.findFirst({
      where: { id: parsed.data.serviceId, orgId: user.orgId },
    });
    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    const usage = await prisma.apiUsage.create({
      data: {
        serviceId: parsed.data.serviceId,
        orgId: user.orgId,
        date: new Date(parsed.data.date),
        requests: parsed.data.requests,
        tokens: parsed.data.tokens || 0,
        cost: parsed.data.cost,
        model: parsed.data.model,
      },
    });

    return NextResponse.json({ usage }, { status: 201 });
  } catch (err) {
    return handleAuthError(err);
  }
}
