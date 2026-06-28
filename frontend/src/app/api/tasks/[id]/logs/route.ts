import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleAuthError } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const task = await prisma.task.findFirst({
      where: { id, orgId: user.orgId },
      select: { id: true },
    });
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const logs = await prisma.executionLog.findMany({
      where: { taskId: id },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ logs });
  } catch (err) {
    return handleAuthError(err);
  }
}
