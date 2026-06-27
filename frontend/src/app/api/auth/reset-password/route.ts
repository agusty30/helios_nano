import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { email, token, password } = await request.json();

    if (!email || !token || !password) {
      return NextResponse.json({ error: "Email, token, and password are required" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "Invalid reset link" }, { status: 400 });
    }

    const resets = await prisma.passwordResetToken.findMany({
      where: {
        userId: user.id,
        used: false,
        expires: { gte: new Date() },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    let validReset = null;
    for (const reset of resets) {
      const match = await bcrypt.compare(token, reset.tokenHash);
      if (match) {
        validReset = reset;
        break;
      }
    }

    if (!validReset) {
      return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.$transaction([
      prisma.passwordResetToken.update({
        where: { id: validReset.id },
        data: { used: true },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash, locked: false, lockedAt: null },
      }),
      prisma.session.deleteMany({ where: { userId: user.id } }),
    ]);

    return NextResponse.json({ success: true, message: "Password reset successfully. You can now sign in." });
  } catch (error: unknown) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}
