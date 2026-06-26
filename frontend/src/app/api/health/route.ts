import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { execSync } from "child_process";

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

export async function POST() {
  try {
    const output = execSync(
      "npx prisma db push --skip-generate --accept-data-loss 2>&1",
      { cwd: process.cwd(), timeout: 30000, env: process.env as NodeJS.ProcessEnv }
    ).toString();
    return NextResponse.json({ success: true, output });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
