import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function GET(request: NextRequest) {
  const results: Record<string, unknown> = {};

  const isSecure = request.nextUrl.protocol === "https:";
  results.protocol = request.nextUrl.protocol;
  results.isSecure = isSecure;

  const allCookies = request.cookies.getAll();
  results.cookies = allCookies.map(c => ({ name: c.name, valueLen: c.value.length }));

  // The fix: pass secureCookie to match the cookie prefix
  try {
    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
      secureCookie: isSecure,
    });
    results.getToken_secureCookie = token ? { sub: token.sub, email: token.email, role: token.role, emailVerified: token.emailVerified } : "null";
  } catch (e) {
    results.getToken_secureCookie = `error: ${e instanceof Error ? e.message : String(e)}`;
  }

  // Also try with explicit cookieName
  try {
    const cookieName = isSecure ? "__Secure-authjs.session-token" : "authjs.session-token";
    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
      cookieName,
    });
    results.getToken_explicitCookie = token ? { sub: token.sub, email: token.email } : "null";
  } catch (e) {
    results.getToken_explicitCookie = `error: ${e instanceof Error ? e.message : String(e)}`;
  }

  results.has_auth_secret = !!process.env.AUTH_SECRET;
  results.has_nextauth_secret = !!process.env.NEXTAUTH_SECRET;

  return NextResponse.json(results);
}
