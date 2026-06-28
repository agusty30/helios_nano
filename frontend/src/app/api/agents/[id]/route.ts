import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { status, config, name } = body;

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
    },
  });

  await prisma.auditLog.create({
    data: {
      orgId: user.orgId,
      userId: user.id,
      action: "update",
      entity: "Agent",
      entityId: id,
      before: { status: existing.status },
      after: { status: agent.status },
    },
  });

  return NextResponse.json({ agent });
}
