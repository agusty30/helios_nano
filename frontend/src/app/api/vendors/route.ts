import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole, handleAuthError } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { vendorCreateSchema } from "@/lib/validation";

export async function GET() {
  try {
    const user = await requireAuth();
    const vendors = await prisma.vendor.findMany({
      where: { orgId: user.orgId },
      include: {
        _count: { select: { subscriptions: true, apiServices: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ vendors });
  } catch (err) {
    return handleAuthError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole("FINANCE");
    const body = await request.json();
    const parsed = vendorCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const vendor = await prisma.vendor.create({
      data: { orgId: user.orgId, ...parsed.data },
    });

    await prisma.auditLog.create({
      data: {
        orgId: user.orgId,
        userId: user.id,
        action: "create",
        entity: "Vendor",
        entityId: vendor.id,
        after: { name: vendor.name, category: vendor.category },
      },
    });

    return NextResponse.json({ vendor }, { status: 201 });
  } catch (err) {
    return handleAuthError(err);
  }
}
