import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole, handleAuthError } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { apiServiceCreateSchema } from "@/lib/validation";

export async function GET() {
  try {
    const user = await requireAuth();
    const services = await prisma.apiService.findMany({
      where: { orgId: user.orgId },
      include: {
        vendor: { select: { id: true, name: true, logo: true } },
        _count: { select: { usages: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ services });
  } catch (err) {
    return handleAuthError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole("FINANCE");
    const body = await request.json();
    const parsed = apiServiceCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const service = await prisma.apiService.create({
      data: { orgId: user.orgId, ...parsed.data },
    });

    await prisma.auditLog.create({
      data: {
        orgId: user.orgId,
        userId: user.id,
        action: "create",
        entity: "ApiService",
        entityId: service.id,
        after: { name: service.name, provider: service.provider },
      },
    });

    return NextResponse.json({ service }, { status: 201 });
  } catch (err) {
    return handleAuthError(err);
  }
}
