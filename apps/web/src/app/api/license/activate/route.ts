// apps/web/src/app/api/license/activate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { validateLicense } from "@/lib/license";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const { licenseKey } = await request.json();
    if (!licenseKey) {
      return NextResponse.json({ error: "Licence key required" }, { status: 400 });
    }

    const license = await validateLicense(licenseKey);
    if (!license) {
      return NextResponse.json({ error: "Invalid or expired licence key." }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { licenseId: license.id },
    });

    return NextResponse.json({ success: true, licenseId: license.id });
  } catch (error: any) {
    console.error("Activation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}