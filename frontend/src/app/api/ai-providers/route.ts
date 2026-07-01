import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { encryptPrivateKey } from "@/lib/crypto";

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const providers = await prisma.aiProvider.findMany({
    where: { orgId: user.orgId },
    orderBy: { createdAt: "desc" },
  });

  const safe = providers.map(p => ({
    ...p,
    apiKeyEncrypted: undefined,
    hasApiKey: !!p.apiKeyEncrypted,
    apiKeyLast4: p.apiKeyEncrypted ? "••••" : null,
  }));

  return NextResponse.json({ providers: safe });
}

export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin role required" }, { status: 403 });
  }

  const body = await request.json();
  const { name, slug, baseUrl, apiKey, defaultModel, isDefault } = body;

  if (!name || !slug || !baseUrl || !defaultModel) {
    return NextResponse.json({ error: "name, slug, baseUrl, and defaultModel are required" }, { status: 400 });
  }

  const slugClean = slug.toLowerCase().replace(/[^a-z0-9-]/g, "-");

  const existing = await prisma.aiProvider.findFirst({
    where: { orgId: user.orgId, slug: slugClean },
  });
  if (existing) {
    return NextResponse.json({ error: "Provider with this slug already exists" }, { status: 409 });
  }

  if (isDefault) {
    await prisma.aiProvider.updateMany({
      where: { orgId: user.orgId, isDefault: true },
      data: { isDefault: false },
    });
  }

  const provider = await prisma.aiProvider.create({
    data: {
      orgId: user.orgId,
      name,
      slug: slugClean,
      baseUrl,
      apiKeyEncrypted: apiKey ? encryptPrivateKey(apiKey) : null,
      defaultModel,
      isDefault: isDefault || false,
    },
  });

  await prisma.auditLog.create({
    data: {
      orgId: user.orgId,
      userId: user.id,
      action: "create",
      entity: "AiProvider",
      entityId: provider.id,
      after: { name, slug: slugClean, baseUrl, defaultModel, isDefault: isDefault || false },
    },
  });

  return NextResponse.json({
    provider: {
      ...provider,
      apiKeyEncrypted: undefined,
      hasApiKey: !!apiKey,
      apiKeyLast4: apiKey ? "••••" : null,
    },
  }, { status: 201 });
}
