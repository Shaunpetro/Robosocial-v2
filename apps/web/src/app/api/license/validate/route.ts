// apps/web/src/app/api/license/validate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { validateLicense } from "@/lib/license";

export async function GET(request: NextRequest) {
  const licenseKey = request.cookies.get("robo-license")?.value || "";
  if (!licenseKey) {
    return NextResponse.json({ valid: false }, { status: 401 });
  }
  const license = await validateLicense(licenseKey);
  return NextResponse.json({ valid: !!license });
}