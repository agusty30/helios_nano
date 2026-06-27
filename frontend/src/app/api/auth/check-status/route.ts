import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email) return NextResponse.json({ status: "unknown" });

    const user = await prisma.user.findUnique({
      where: { email },
      select: { locked: true, lockedAt: true, emailVerified: true },
    });

    if (!user) return NextResponse.json({ status: "ok" });

    if (user.locked) {
      if (user.lockedAt) {
        const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);
        if (user.lockedAt > thirtyMinAgo) {
          const minutesLeft = Math.ceil((user.lockedAt.getTime() + 30 * 60 * 1000 - Date.now()) / 60000);
          return NextResponse.json({ status: "locked", minutesLeft });
        }
      }
      return NextResponse.json({ status: "locked" });
    }

    if (!user.emailVerified) {
      return NextResponse.json({ status: "unverified", email });
    }

    return NextResponse.json({ status: "ok" });
  } catch {
    return NextResponse.json({ status: "ok" });
  }
}
