// apps/web/src/app/api/admin/licenses/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/license";

export async function GET(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const licenses = await prisma.license.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      customerName: true,
      maxSocialAccounts: true,
      status: true,
      expiresAt: true,
      fromEmail: true,
      keyPreview: true,
      createdAt: true,
      // licenseKeyHash is never exposed
    },
  });

  return NextResponse.json(licenses);
}