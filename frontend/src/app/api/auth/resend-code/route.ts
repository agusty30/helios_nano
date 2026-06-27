import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ success: true, message: "If the email exists, a new code has been sent." });
    }

    if (user.emailVerified) {
      return NextResponse.json({ error: "Email already verified" }, { status: 400 });
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCodes = await prisma.emailVerification.count({
      where: { userId: user.id, createdAt: { gte: oneHourAgo } },
    });

    if (recentCodes >= 5) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }

    await prisma.emailVerification.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    const code = crypto.randomInt(100000, 999999).toString();
    const codeHash = await bcrypt.hash(code, 10);

    await prisma.emailVerification.create({
      data: {
        userId: user.id,
        codeHash,
        expires: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    try {
      await sendVerificationEmail(email, code, user.name.split(" ")[0]);
    } catch (emailErr) {
      console.error("Email send error:", emailErr);
    }

    return NextResponse.json({ success: true, message: "A new verification code has been sent." });
  } catch (error: unknown) {
    console.error("Resend code error:", error);
    return NextResponse.json({ error: "Failed to resend code" }, { status: 500 });
  }
}
