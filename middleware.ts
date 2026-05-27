import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/calendar",
  "/cleanings",
  "/guests",
  "/inventory",
  "/maintenance",
  "/messaging",
  "/properties",
  "/reports",
  "/reservations",
  "/settings",
];

const AUTH_PREFIXES = ["/login", "/signup", "/forgot-password"];

function matchesPrefix(pathname: string, prefixes: string[]) {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value);

  if (matchesPrefix(pathname, PROTECTED_PREFIXES) && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (matchesPrefix(pathname, AUTH_PREFIXES) && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/calendar/:path*",
    "/cleanings/:path*",
    "/guests/:path*",
    "/inventory/:path*",
    "/maintenance/:path*",
    "/messaging/:path*",
    "/properties/:path*",
    "/reports/:path*",
    "/reservations/:path*",
    "/settings/:path*",
    "/login",
    "/signup",
    "/forgot-password",
  ],
};
