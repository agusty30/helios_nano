import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC_PAGES = [
  "/", "/features", "/pricing", "/docs", "/about", "/contact",
  "/login", "/register", "/verify", "/forgot-password", "/reset-password",
];

const PUBLIC_API = [
  "/api/auth",
  "/api/health",
  "/api/status",
  "/api/ready",
  "/api/metrics",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon")) {
    return NextResponse.next();
  }

  if (PUBLIC_API.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  if (PUBLIC_PAGES.some((p) => p === "/" ? pathname === "/" : pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  const token = await getToken({
    req: request,
    secret,
    secureCookie: request.nextUrl.protocol === "https:",
  });

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!token.emailVerified && pathname !== "/verify" && !pathname.startsWith("/api/")) {
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
