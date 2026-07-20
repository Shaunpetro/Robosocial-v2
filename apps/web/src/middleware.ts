// apps/web/src/middleware.ts
import { auth } from "@/lib/auth";

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|login|register|admin|activate|license-expired).*)",
  ],
};

export default auth;