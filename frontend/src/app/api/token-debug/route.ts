import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function GET(request: NextRequest) {
  const results: Record<string, unknown> = {};

  // Show what cookies exist
  const allCookies = request.cookies.getAll();
  results.cookies = allCookies.map(c => ({ name: c.name, valueLen: c.value.length }));

  // Try getToken with explicit secret
  try {
    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
    });
    results.getToken_with_secret = token ? { sub: token.sub, email: token.email, role: token.role } : "null";
  } catch (e) {
    results.getToken_with_secret = `error: ${e instanceof Error ? e.message : String(e)}`;
  }

  // Try getToken without secret (uses env auto-detect)
  try {
    const token = await getToken({ req: request });
    results.getToken_auto = token ? { sub: token.sub, email: token.email } : "null";
  } catch (e) {
    results.getToken_auto = `error: ${e instanceof Error ? e.message : String(e)}`;
  }

  // Try with explicit salt
  try {
    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
      salt: "__Secure-authjs.session-token",
    });
    results.getToken_secure_salt = token ? { sub: token.sub, email: token.email } : "null";
  } catch (e) {
    results.getToken_secure_salt = `error: ${e instanceof Error ? e.message : String(e)}`;
  }

  // Try with non-secure salt
  try {
    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
      salt: "authjs.session-token",
    });
    results.getToken_nonsecure_salt = token ? { sub: token.sub, email: token.email } : "null";
  } catch (e) {
    results.getToken_nonsecure_salt = `error: ${e instanceof Error ? e.message : String(e)}`;
  }

  // Show env state
  results.has_auth_secret = !!process.env.AUTH_SECRET;
  results.has_nextauth_secret = !!process.env.NEXTAUTH_SECRET;
  results.nextauth_url = process.env.NEXTAUTH_URL || "not set";

  return NextResponse.json(results);
}
