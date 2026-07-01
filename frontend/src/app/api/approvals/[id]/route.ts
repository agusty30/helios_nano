import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN" && user.role !== "FINANCE") {
    return NextResponse.json({ error: "Admin or Finance role required" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { status } = body;

  if (!status || !["approved", "rejected"].includes(status)) {
    return NextResponse.json({ error: "Status must be 'approved' or 'rejected'" }, { status: 400 });
  }

  const existing = await prisma.approval.findFirst({
    where: { id, orgId: user.orgId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Approval not found" }, { status: 404 });
  }

  if (existing.status !== "pending") {
    return NextResponse.json({ error: "Approval already resolved" }, { status: 400 });
  }

  const approval = await prisma.approval.update({
    where: { id },
    data: {
      status,
      resolvedAt: new Date(),
      resolvedBy: user.id,
    },
  });

  if (status === "approved") {
    const paymentAgent = await prisma.agent.findFirst({
      where: { orgId: user.orgId, name: "Payment Agent", walletId: { not: null } },
      select: { walletId: true },
    });

    await prisma.transaction.create({
      data: {
        orgId: user.orgId,
        type: "payment",
        amount: approval.amount,
        status: "COMPLETED",
        reference: `approval:${approval.id}`,
        walletId: paymentAgent?.walletId || null,
        fromWalletId: paymentAgent?.walletId || null,
        metadata: { vendor: approval.vendor, department: approval.department },
      },
    });
  }

  await prisma.auditLog.create({
    data: {
      orgId: user.orgId,
      userId: user.id,
      action: status,
      entity: "Approval",
      entityId: id,
      before: { status: "pending" },
      after: { status, resolvedBy: user.name },
    },
  });

  return NextResponse.json({ approval });
}
