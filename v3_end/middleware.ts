import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow login and static
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth/login") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/assets") ||
    pathname.startsWith("/api/health")
  ) {
    return NextResponse.next();
  }

  // Allow public api auth logout + me (optional)
  if (pathname.startsWith("/api/auth/logout") || pathname.startsWith("/api/me")) {
    return NextResponse.next();
  }

  const hasSession = req.cookies.get("session_user")?.value;
  if (!hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/auth/login).*)"],
};
