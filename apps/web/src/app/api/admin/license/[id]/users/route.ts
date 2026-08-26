// apps/web/src/app/api/admin/licenses/[id]/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/license";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const users = await prisma.user.findMany({
    where: { licenseId: id },
    select: { id: true, email: true, name: true },
  });

  return NextResponse.json(users);
}