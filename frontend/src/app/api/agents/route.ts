import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const agents = await prisma.agent.findMany({
    where: { orgId: user.orgId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ agents });
}

export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin required" }, { status: 403 });
  }

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
}
