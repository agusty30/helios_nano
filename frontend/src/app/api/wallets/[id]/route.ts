import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN" && user.role !== "FINANCE") {
    return NextResponse.json({ error: "Admin or Finance role required" }, { status: 403 });
  }

  const { id } = await params;
  const wallet = await prisma.wallet.findFirst({
    where: { id, orgId: user.orgId, deletedAt: null },
  });
  if (!wallet) {
    return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
  }

  const body = await request.json();
  const updates: Record<string, unknown> = {};
  if (body.label !== undefined) updates.label = body.label;
  if (body.status !== undefined) updates.status = body.status;
  if (body.isDefault !== undefined) updates.isDefault = body.isDefault;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  if (updates.isDefault === true) {
    await prisma.wallet.updateMany({
      where: { orgId: user.orgId, isDefault: true },
      data: { isDefault: false },
    });
  }

  const updated = await prisma.wallet.update({
    where: { id },
    data: updates,
  });

  await prisma.auditLog.create({
    data: {
      orgId: user.orgId,
      userId: user.id,
      action: "update",
      entity: "Wallet",
      entityId: id,
      before: { label: wallet.label, status: wallet.status, isDefault: wallet.isDefault },
      after: updates as Record<string, string | boolean>,
    },
  });

  return NextResponse.json({ wallet: updated });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN" && user.role !== "FINANCE") {
    return NextResponse.json({ error: "Admin or Finance role required" }, { status: 403 });
  }

  const { id } = await params;
  const wallet = await prisma.wallet.findFirst({
    where: { id, orgId: user.orgId, deletedAt: null },
  });
  if (!wallet) {
    return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
  }

  const linkedAgents = await prisma.agent.count({ where: { walletId: id } });
  if (linkedAgents > 0) {
    return NextResponse.json(
      { error: `Cannot delete: wallet is linked to ${linkedAgents} agent(s). Unlink them first.` },
      { status: 409 }
    );
  }

  await prisma.wallet.update({
    where: { id },
    data: { deletedAt: new Date(), status: "deleted" },
  });

  await prisma.auditLog.create({
    data: {
      orgId: user.orgId,
      userId: user.id,
      action: "delete",
      entity: "Wallet",
      entityId: id,
      before: { label: wallet.label, address: wallet.address },
    },
  });

  return NextResponse.json({ success: true });
}
