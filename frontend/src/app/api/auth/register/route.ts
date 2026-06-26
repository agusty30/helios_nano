import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, signToken, setAuthCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, companyName } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    const org = await prisma.organization.create({
      data: {
        name: companyName || `${name}'s Organization`,
        users: {
          create: { name, email, passwordHash, role: "ADMIN" },
        },
        paymentPolicies: {
          create: {},
        },
      },
      include: { users: true },
    });

    const user = org.users[0];
    const token = signToken({ userId: user.id, orgId: org.id, role: user.role });

    const response = NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      org: { id: org.id, name: org.name },
    });

    const cookieHeader = setAuthCookie(token);
    response.headers.set("Set-Cookie", cookieHeader["Set-Cookie"]);
    return response;
  } catch (error: unknown) {
    console.error("Register error:", error);
    const message = error instanceof Error ? error.message : "Registration failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
