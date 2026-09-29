// apps/web/src/app/api/app-promotion/posts/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { deleteFacebookPost } from "@/lib/app-promotion/facebook";

function isAllowlisted(email: string | null | undefined): boolean {
  if (!email) return false;
  const raw = process.env.APP_PROMOTION_ALLOWLIST || "";
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.toLowerCase());
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email || !isAllowlisted(session.user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const log = await prisma.promoPostLog.findUnique({ where: { id } });
  if (!log) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (log.status === "POSTED" && log.facebookPostId) {
    const result = await deleteFacebookPost(log.facebookPostId);
    if (!result.success) {
      return NextResponse.json(
        { error: `Facebook delete failed: ${result.error}` },
        { status: 502 }
      );
    }
  }

  await prisma.promoPostLog.update({
    where: { id },
    data: { status: "DELETED" },
  });

  return NextResponse.json({ ok: true });
}

export async function PATCH(
  request: NextRequest,
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
    return NextResponse.json({ error: "Only PENDING posts can be rescheduled" }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const scheduledFor = body?.scheduledFor as string | undefined;
  if (!scheduledFor) {
    return NextResponse.json({ error: "scheduledFor required" }, { status: 400 });
  }

  const target = new Date(scheduledFor);
  if (isNaN(target.getTime())) {
    return NextResponse.json({ error: "Invalid scheduledFor" }, { status: 400 });
  }

  await prisma.promoPostLog.update({
    where: { id },
    data: { scheduledFor: target },
  });

  return NextResponse.json({ ok: true });
}