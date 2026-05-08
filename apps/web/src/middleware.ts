// apps/web/src/middleware.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export const config = {
  matcher: [
    "/((?!api/auth|api/admin|api/license|admin|_next/static|_next/image|favicon.ico|login|register|license-expired).*)",
  ],
};

export default auth(async function middleware(req) {
  const { nextUrl } = req;

  // Allow admin pages, auth, static files, and API routes without license check
  if (
    nextUrl.pathname.startsWith("/admin") ||
    nextUrl.pathname.startsWith("/api/auth") ||
    nextUrl.pathname.startsWith("/api/admin") ||
    nextUrl.pathname.startsWith("/api/license") ||
    nextUrl.pathname.startsWith("/login") ||
    nextUrl.pathname.startsWith("/register") ||
    nextUrl.pathname.startsWith("/license-expired")
  ) {
    return NextResponse.next();
  }

  // Check if license cookie exists – if not, redirect to license‑expired page
  const licenseKey = req.cookies.get("robo-license")?.value;
  if (!licenseKey) {
    return NextResponse.redirect(new URL("/license-expired", req.url));
  }

  return NextResponse.next();
});