import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const setting = await prisma.setting.findUnique({
    where: { orgId_key: { orgId: user.orgId, key: "notifications" } },
  });

  const defaults = {
    paymentAlerts: true,
    budgetThreshold: true,
    agentActivity: true,
    securityAlerts: true,
    weeklyDigest: false,
    emailNotifications: true,
  };

  return NextResponse.json({ notifications: setting ? setting.value : defaults, updatedAt: setting?.updatedAt ?? null });
}

export async function PUT(request: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "Admin required" }, { status: 403 });

  const body = await request.json();

  const before = await prisma.setting.findUnique({
    where: { orgId_key: { orgId: user.orgId, key: "notifications" } },
  });

  const setting = await prisma.setting.upsert({
    where: { orgId_key: { orgId: user.orgId, key: "notifications" } },
    create: { orgId: user.orgId, key: "notifications", value: body },
    update: { value: body },
  });

  await prisma.auditLog.create({
    data: {
      orgId: user.orgId,
      userId: user.id,
      action: "update",
      entity: "Setting",
      entityId: setting.id,
      before: (before?.value ?? undefined) as Prisma.InputJsonValue | undefined,
      after: body as Prisma.InputJsonValue,
    },
  });

  return NextResponse.json({ notifications: setting.value, updatedAt: setting.updatedAt });
}
