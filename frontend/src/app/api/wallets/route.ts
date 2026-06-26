import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const wallets = await prisma.wallet.findMany({
    where: { orgId: user.orgId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ wallets });
}

export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN" && user.role !== "FINANCE") {
    return NextResponse.json({ error: "Admin or Finance role required" }, { status: 403 });
  }

  const body = await request.json();
  const { label, address, type } = body;

  if (!label || !address) {
    return NextResponse.json({ error: "Label and address are required" }, { status: 400 });
  }

  const wallet = await prisma.wallet.create({
    data: {
      orgId: user.orgId,
      label,
      address,
      type: type || "AGENT",
    },
  });

  await prisma.auditLog.create({
    data: {
      orgId: user.orgId,
      userId: user.id,
      action: "create",
      entity: "Wallet",
      entityId: wallet.id,
      after: { label: wallet.label, address: wallet.address, type: wallet.type },
    },
  });

  return NextResponse.json({ wallet }, { status: 201 });
}
