import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC = [
  "/", "/features", "/pricing", "/docs", "/about", "/contact",
  "/login", "/register", "/verify", "/forgot-password", "/reset-password",
];

const AUTH_API = ["/api/auth"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/api/health") ||
    AUTH_API.some((p) => pathname.startsWith(p))
  ) {
    return NextResponse.next();
  }

  if (PUBLIC.some((p) => p === "/" ? pathname === "/" : pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
    secureCookie: request.nextUrl.protocol === "https:",
  });

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!token.emailVerified && pathname !== "/verify") {
    const verifyUrl = new URL("/verify", request.url);
    if (token.email) {
      verifyUrl.searchParams.set("email", token.email as string);
    }
    return NextResponse.redirect(verifyUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
