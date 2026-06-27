import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json({ error: "Email and code are required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ error: "Email already verified" }, { status: 400 });
    }

    const verifications = await prisma.emailVerification.findMany({
      where: {
        userId: user.id,
        used: false,
        expires: { gte: new Date() },
      },
      orderBy: { createdAt: "desc" },
      take: 1,
    });

    if (verifications.length === 0) {
      return NextResponse.json({ error: "No valid verification code found. Please request a new one." }, { status: 400 });
    }

    const verification = verifications[0];
    const valid = await bcrypt.compare(code, verification.codeHash);

    if (!valid) {
      return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.emailVerification.update({
        where: { id: verification.id },
        data: { used: true },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Email verified successfully. You can now sign in.",
    });
  } catch (error: unknown) {
    console.error("Verify error:", error);
    const message = error instanceof Error ? error.message : "Verification failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
