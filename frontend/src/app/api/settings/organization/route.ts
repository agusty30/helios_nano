import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole, handleAuthError } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await requireAuth();

    const org = await prisma.organization.findUnique({
      where: { id: user.orgId },
      select: { id: true, name: true, industry: true, timezone: true, currency: true, updatedAt: true },
    });

    return NextResponse.json({ organization: org });
  } catch (err) { return handleAuthError(err); }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireRole("ADMIN");

    const body = await request.json();
    const { name, industry, timezone } = body;

    const before = await prisma.organization.findUnique({ where: { id: user.orgId } });

    const org = await prisma.organization.update({
      where: { id: user.orgId },
      data: {
        ...(name !== undefined && { name }),
        ...(industry !== undefined && { industry }),
        ...(timezone !== undefined && { timezone }),
      },
      select: { id: true, name: true, industry: true, timezone: true, currency: true, updatedAt: true },
    });

    await prisma.auditLog.create({
      data: {
        orgId: user.orgId,
        userId: user.id,
        action: "update",
        entity: "Organization",
        entityId: user.orgId,
        before: { name: before?.name, industry: before?.industry, timezone: before?.timezone },
        after: { name: org.name, industry: org.industry, timezone: org.timezone },
      },
    });

    return NextResponse.json({ organization: org });
  } catch (err) { return handleAuthError(err); }
}
