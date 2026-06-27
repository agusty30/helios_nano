import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const policy = await prisma.paymentPolicy.findUnique({ where: { orgId: user.orgId } });
  return NextResponse.json({ policy: policy ?? { autoApproveThreshold: 500, dailyLimit: 10, agentLimit: 1000, require2fa: true } });
}

export async function PUT(request: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "Admin required" }, { status: 403 });

  const body = await request.json();
  const { autoApproveThreshold, dailyLimit, agentLimit, require2fa } = body;

  const before = await prisma.paymentPolicy.findUnique({ where: { orgId: user.orgId } });

  const policy = await prisma.paymentPolicy.upsert({
    where: { orgId: user.orgId },
    create: {
      orgId: user.orgId,
      ...(autoApproveThreshold !== undefined && { autoApproveThreshold }),
      ...(dailyLimit !== undefined && { dailyLimit }),
      ...(agentLimit !== undefined && { agentLimit }),
      ...(require2fa !== undefined && { require2fa }),
    },
    update: {
      ...(autoApproveThreshold !== undefined && { autoApproveThreshold }),
      ...(dailyLimit !== undefined && { dailyLimit }),
      ...(agentLimit !== undefined && { agentLimit }),
      ...(require2fa !== undefined && { require2fa }),
    },
  });

  await prisma.auditLog.create({
    data: {
      orgId: user.orgId,
      userId: user.id,
      action: "update",
      entity: "PaymentPolicy",
      entityId: policy.id,
      before: before ? { autoApproveThreshold: before.autoApproveThreshold, dailyLimit: before.dailyLimit, agentLimit: before.agentLimit, require2fa: before.require2fa } : undefined,
      after: { autoApproveThreshold: policy.autoApproveThreshold, dailyLimit: policy.dailyLimit, agentLimit: policy.agentLimit, require2fa: policy.require2fa },
    },
  });

  return NextResponse.json({ policy });
}
