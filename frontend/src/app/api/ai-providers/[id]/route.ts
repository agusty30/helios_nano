import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { encryptPrivateKey } from "@/lib/crypto";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const provider = await prisma.aiProvider.findFirst({
    where: { id, orgId: user.orgId },
  });

  if (!provider) {
    return NextResponse.json({ error: "Provider not found" }, { status: 404 });
  }

  return NextResponse.json({
    provider: {
      ...provider,
      apiKeyEncrypted: undefined,
      hasApiKey: !!provider.apiKeyEncrypted,
      apiKeyLast4: provider.apiKeyEncrypted ? "••••" : null,
    },
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin role required" }, { status: 403 });
  }

  const { id } = await params;
  const existing = await prisma.aiProvider.findFirst({
    where: { id, orgId: user.orgId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Provider not found" }, { status: 404 });
  }

  const body = await request.json();
  const { name, baseUrl, apiKey, defaultModel, status, isDefault } = body;

  if (isDefault) {
    await prisma.aiProvider.updateMany({
      where: { orgId: user.orgId, isDefault: true, id: { not: id } },
      data: { isDefault: false },
    });
  }

  const provider = await prisma.aiProvider.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(baseUrl !== undefined && { baseUrl }),
      ...(apiKey !== undefined && { apiKeyEncrypted: apiKey ? encryptPrivateKey(apiKey) : null }),
      ...(defaultModel !== undefined && { defaultModel }),
      ...(status !== undefined && { status }),
      ...(isDefault !== undefined && { isDefault }),
    },
  });

  await prisma.auditLog.create({
    data: {
      orgId: user.orgId,
      userId: user.id,
      action: "update",
      entity: "AiProvider",
      entityId: id,
      before: { name: existing.name, baseUrl: existing.baseUrl, defaultModel: existing.defaultModel },
      after: { name: provider.name, baseUrl: provider.baseUrl, defaultModel: provider.defaultModel },
    },
  });

  return NextResponse.json({
    provider: {
      ...provider,
      apiKeyEncrypted: undefined,
      hasApiKey: !!provider.apiKeyEncrypted,
      apiKeyLast4: provider.apiKeyEncrypted ? "••••" : null,
    },
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin role required" }, { status: 403 });
  }

  const { id } = await params;
  const existing = await prisma.aiProvider.findFirst({
    where: { id, orgId: user.orgId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Provider not found" }, { status: 404 });
  }

  await prisma.aiProvider.delete({ where: { id } });

  await prisma.auditLog.create({
    data: {
      orgId: user.orgId,
      userId: user.id,
      action: "delete",
      entity: "AiProvider",
      entityId: id,
      before: { name: existing.name, slug: existing.slug },
    },
  });

  return NextResponse.json({ deleted: true });
}
