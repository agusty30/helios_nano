import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole, handleAuthError } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await requireAuth();
    const agents = await prisma.agent.findMany({
      where: { orgId: user.orgId },
      include: {
        _count: { select: { tasks: true } },
        wallet: { select: { label: true, address: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ agents });
  } catch (err) {
    return handleAuthError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole("ADMIN");
    const body = await request.json();
    const { name, type, status, config, walletId } = body;

    if (!name || !type) {
      return NextResponse.json({ error: "Name and type are required" }, { status: 400 });
    }

    const agent = await prisma.agent.create({
      data: {
        orgId: user.orgId,
        name,
        type,
        status: status || "active",
        config: config || {},
        walletId: walletId || null,
      },
    });

    await prisma.auditLog.create({
      data: {
        orgId: user.orgId,
        userId: user.id,
        action: "create",
        entity: "Agent",
        entityId: agent.id,
        after: { name: agent.name, type: agent.type },
      },
    });

    return NextResponse.json({ agent }, { status: 201 });
  } catch (err) {
    return handleAuthError(err);
  }
}
