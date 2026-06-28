import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleAuthError } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unread") === "true";
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);

    const where = {
      orgId: user.orgId,
      ...(unreadOnly ? { read: false } : {}),
      OR: [{ userId: null }, { userId: user.id }],
    };

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.notification.count({
        where: { orgId: user.orgId, read: false, OR: [{ userId: null }, { userId: user.id }] },
      }),
    ]);

    return NextResponse.json({ notifications, unreadCount });
  } catch (err) {
    return handleAuthError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { action, ids } = body;

    if (action === "mark_read" && Array.isArray(ids)) {
      await prisma.notification.updateMany({
        where: { id: { in: ids }, orgId: user.orgId },
        data: { read: true },
      });
      return NextResponse.json({ success: true });
    }

    if (action === "mark_all_read") {
      await prisma.notification.updateMany({
        where: { orgId: user.orgId, read: false, OR: [{ userId: null }, { userId: user.id }] },
        data: { read: true },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    return handleAuthError(err);
  }
}
