// apps/web/src/middleware.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { validateLicense } from "@/lib/license";

export const config = {
  matcher: [
    "/((?!api/auth|api/admin|_next/static|_next/image|favicon.ico|login|register).*)",
  ],
};

export default auth(async function middleware(req) {
  const { nextUrl } = req;

  // Allow authentication pages and admin API without license check
  if (
    nextUrl.pathname.startsWith("/api/auth") ||
    nextUrl.pathname.startsWith("/api/admin") ||
    nextUrl.pathname.startsWith("/login") ||
    nextUrl.pathname.startsWith("/register")
  ) {
    return NextResponse.next();
  }

  // Check license from a cookie or header
  const licenseKey =
    req.cookies.get("robo-license")?.value ||
    req.headers.get("x-robo-license") ||
    "";

  const license = await validateLicense(licenseKey);
  if (!license) {
    // License expired or missing – redirect to a friendly "license expired" page
    if (nextUrl.pathname !== "/license-expired") {
      return NextResponse.redirect(new URL("/license-expired", req.url));
    }
    // If user is already on the expired page, allow
    return NextResponse.next();
  }

  // Check social account limit (optional enforcement)
  if (nextUrl.pathname === "/api/platforms" && req.method === "POST") {
    const companyId = nextUrl.searchParams.get("companyId");
    if (companyId) {
      const { prisma } = await import("@/lib/db");
      const platformCount = await prisma.platform.count({
        where: { companyId },
      });
      if (platformCount >= license.maxSocialAccounts) {
        return NextResponse.json(
          { error: "Social account limit reached for this license" },
          { status: 403 }
        );
      }
    }
  }

  return NextResponse.next();
});