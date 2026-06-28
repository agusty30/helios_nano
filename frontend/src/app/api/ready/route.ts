import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ready: true }, { status: 200 });
  } catch {
    return NextResponse.json({ ready: false, reason: "database unreachable" }, { status: 503 });
  }
}
