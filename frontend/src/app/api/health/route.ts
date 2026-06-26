import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const checks: Record<string, string> = {};

  checks.database_url = process.env.DATABASE_URL ? "set" : "missing";
  checks.jwt_secret = process.env.JWT_SECRET ? "set" : "missing";

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = "connected";
  } catch (error: unknown) {
    checks.database = `error: ${error instanceof Error ? error.message : String(error)}`;
  }

  try {
    const userCount = await prisma.user.count();
    checks.tables = `ok (${userCount} users)`;
  } catch (error: unknown) {
    checks.tables = `error: ${error instanceof Error ? error.message : String(error)}`;
  }

  const healthy = checks.database === "connected" && checks.tables.startsWith("ok");

  return NextResponse.json({ healthy, checks }, { status: healthy ? 200 : 503 });
}
