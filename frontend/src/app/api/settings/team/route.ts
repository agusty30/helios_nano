import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole, handleAuthError } from "@/lib/session";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await requireAuth();

    const members = await prisma.user.findMany({
      where: { orgId: user.orgId },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ members });
  } catch (err) { return handleAuthError(err); }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole("ADMIN");

  const body = await request.json();
  const { name, email, password, role } = body;

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const member = await prisma.user.create({
    data: { orgId: user.orgId, name, email, passwordHash, role: role || "VIEWER" },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  await prisma.auditLog.create({
    data: {
      orgId: user.orgId,
      userId: user.id,
      action: "create",
      entity: "User",
      entityId: member.id,
      after: { name: member.name, email: member.email, role: member.role },
    },
  });

  return NextResponse.json({ member }, { status: 201 });
  } catch (err) { return handleAuthError(err); }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireRole("ADMIN");

  const { searchParams } = new URL(request.url);
  const memberId = searchParams.get("id");
  if (!memberId) return NextResponse.json({ error: "Member ID required" }, { status: 400 });
  if (memberId === user.id) return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 });

  const member = await prisma.user.findFirst({ where: { id: memberId, orgId: user.orgId } });
  if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });

  await prisma.user.delete({ where: { id: memberId } });

  await prisma.auditLog.create({
    data: {
      orgId: user.orgId,
      userId: user.id,
      action: "delete",
      entity: "User",
      entityId: memberId,
      before: { name: member.name, email: member.email, role: member.role },
    },
  });

  return NextResponse.json({ ok: true });
  } catch (err) { return handleAuthError(err); }
}
