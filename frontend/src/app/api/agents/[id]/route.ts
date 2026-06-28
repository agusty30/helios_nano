import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const agent = await prisma.agent.findFirst({
    where: { id, orgId: user.orgId },
    include: {
      _count: { select: { tasks: true, metrics: true } },
      wallet: { select: { label: true, address: true } },
      tasks: { orderBy: { createdAt: "desc" }, take: 5, select: { id: true, command: true, status: true, executionTimeMs: true, createdAt: true } },
    },
  });

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  return NextResponse.json({ agent });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { status, config, name, description, walletId } = body;

  const existing = await prisma.agent.findFirst({
    where: { id, orgId: user.orgId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  const agent = await prisma.agent.update({
    where: { id },
    data: {
      ...(status !== undefined && { status }),
      ...(config !== undefined && { config }),
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(walletId !== undefined && { walletId: walletId || null }),
    },
  });

  await prisma.auditLog.create({
    data: {
      orgId: user.orgId,
      userId: user.id,
      action: "update",
      entity: "Agent",
      entityId: id,
      before: { status: existing.status, name: existing.name },
      after: { status: agent.status, name: agent.name },
    },
  });

  return NextResponse.json({ agent });
}
