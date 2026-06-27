import { NextResponse } from "next/server";

export async function GET() {
  const results: Record<string, string> = {};

  // Check env vars
  results.auth_secret = process.env.AUTH_SECRET ? "set" : "missing";
  results.nextauth_secret = process.env.NEXTAUTH_SECRET ? "set" : "missing";
  results.nextauth_url = process.env.NEXTAUTH_URL || "not set";
  results.database_url = process.env.DATABASE_URL ? "set" : "missing";

  // Try importing prisma
  try {
    const { prisma } = await import("@/lib/prisma");
    await prisma.$queryRaw`SELECT 1`;
    results.prisma = "ok";
  } catch (e) {
    results.prisma = `error: ${e instanceof Error ? e.message : String(e)}`;
  }

  // Try importing PrismaAdapter
  try {
    const { PrismaAdapter } = await import("@auth/prisma-adapter");
    const { prisma } = await import("@/lib/prisma");
    const adapter = PrismaAdapter(prisma);
    results.prisma_adapter = adapter ? "created" : "null";
  } catch (e) {
    results.prisma_adapter = `error: ${e instanceof Error ? e.stack || e.message : String(e)}`;
  }

  // Try importing NextAuth
  try {
    const NextAuth = (await import("next-auth")).default;
    results.nextauth_import = "ok";
  } catch (e) {
    results.nextauth_import = `error: ${e instanceof Error ? e.stack || e.message : String(e)}`;
  }

  // Try importing our auth config
  try {
    const auth = await import("@/lib/auth");
    results.auth_import = "ok";
    results.auth_exports = Object.keys(auth).join(", ");
  } catch (e) {
    results.auth_import = `error: ${e instanceof Error ? e.stack || e.message : String(e)}`;
  }

  // Try calling auth() (session check)
  try {
    const { auth } = await import("@/lib/auth");
    const session = await auth();
    results.auth_call = session ? `session: ${JSON.stringify(session)}` : "no session (ok)";
  } catch (e) {
    results.auth_call = `error: ${e instanceof Error ? e.stack || e.message : String(e)}`;
  }

  return NextResponse.json(results);
}
