// apps/web/src/app/api/license/validate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ valid: false }, { status: 401 });
  }

  const licenseId = (session.user as any).licenseId;
  if (!licenseId) {
    return NextResponse.json({ valid: false });
  }

  const license = await prisma.license.findUnique({
    where: { id: licenseId },
    select: { status: true, expiresAt: true },
  });

  if (!license || license.status !== "ACTIVE" || new Date(license.expiresAt) < new Date()) {
    return NextResponse.json({ valid: false });
  }

  return NextResponse.json({ valid: true });
}