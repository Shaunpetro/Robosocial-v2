// apps/web/src/app/api/app-promotion/posts/[id]/publish-now/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { executeDue } from "@/lib/app-promotion/publish";

function isAllowlisted(email: string | null | undefined): boolean {
  if (!email) return false;
  const raw = process.env.APP_PROMOTION_ALLOWLIST || "";
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.toLowerCase());
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email || !isAllowlisted(session.user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const log = await prisma.promoPostLog.findUnique({ where: { id } });
  if (!log) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (log.status !== "PENDING") {
    return NextResponse.json({ error: "Only PENDING posts can be published now" }, { status: 400 });
  }

  await prisma.promoPostLog.update({
    where: { id },
    data: { scheduledFor: new Date() },
  });

  const result = await executeDue();
  return NextResponse.json({ ok: true, ...result });
}