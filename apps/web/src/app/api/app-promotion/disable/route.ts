// apps/web/src/app/api/app-promotion/disable/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

function isAllowlisted(email: string | null | undefined): boolean {
  if (!email) return false;
  const raw = process.env.APP_PROMOTION_ALLOWLIST || "";
  const allowlist = raw
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  return allowlist.includes(email.toLowerCase());
}

export async function POST(request: Request) {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isAllowlisted(email)) {
    return NextResponse.json(
      { error: "App Promotion is not enabled for this account" },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const companyId = typeof body?.companyId === "string" ? body.companyId : null;

  if (!companyId) {
    return NextResponse.json({ error: "companyId is required" }, { status: 400 });
  }

  const membership = await prisma.companyMember.findFirst({
    where: { companyId, user: { email } },
    select: { id: true },
  });

  if (!membership) {
    return NextResponse.json(
      { error: "You do not have access to this company" },
      { status: 403 }
    );
  }

  const existing = await prisma.appPromotionConfig.findUnique({
    where: { companyId },
  });

  if (!existing) {
    return NextResponse.json({ ok: true, enabled: false });
  }

  await prisma.appPromotionConfig.update({
    where: { companyId },
    data: { enabled: false },
  });

  return NextResponse.json({ ok: true, enabled: false });
}