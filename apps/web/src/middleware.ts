// apps/web/src/middleware.ts
// NextAuth v5 middleware. Runs at the edge before any protected route is
// rendered. Redirects unauthenticated users to /login with a callbackUrl,
// and suspended users to /license-expired.
//
// This handles the "no session at all" case. The LicenseGuard component
// handles the "session exists but license is inactive" case — both layers
// are needed.

import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|login|register|admin|activate|license-expired).*)",
  ],
};

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  if (!isLoggedIn) {
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // Suspended flag is injected into the JWT by lib/auth.ts.
  if ((req.auth?.user as any)?.suspended === true) {
    return NextResponse.redirect(new URL("/license-expired", req.url));
  }

  return NextResponse.next();
});