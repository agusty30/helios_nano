import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ success: true, message: "If an account exists, a reset link has been sent." });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = await bcrypt.hash(token, 10);

    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expires: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    const baseUrl = process.env.NEXTAUTH_URL || "https://helios-pay.up.railway.app";
    const resetUrl = `${baseUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    try {
      await sendPasswordResetEmail(email, resetUrl, user.name.split(" ")[0]);
    } catch (emailErr) {
      console.error("Email send error:", emailErr);
    }

    return NextResponse.json({ success: true, message: "If an account exists, a reset link has been sent." });
  } catch (error: unknown) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
