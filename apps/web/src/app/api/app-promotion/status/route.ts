// apps/web/src/app/api/app-promotion/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getHostPlatform } from "@/lib/app-promotion/facebook";
import { getSlotWindow, isPostingDay } from "@/lib/app-promotion/schedule";

function isAllowlisted(email: string | null | undefined): boolean {
  if (!email) return false;
  const raw = process.env.APP_PROMOTION_ALLOWLIST || "";
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.toLowerCase());
}

interface UpcomingSlot {
  date: string;
  slotIndex: 1 | 2 | 3;
  startUtc: string;
  endUtc: string;
}

export async function GET(request: NextRequest) {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAllowlisted(email)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const companyId = new URL(request.url).searchParams.get("companyId");
  if (!companyId) return NextResponse.json({ error: "companyId required" }, { status: 400 });

  const hostCompanyId = process.env.APP_PROMOTION_HOST_COMPANY_ID;
  if (!hostCompanyId || companyId !== hostCompanyId) {
    return NextResponse.json(
      { error: "App Promotion is only available for the host company" },
      { status: 403 }
    );
  }

  const membership = await prisma.companyMember.findFirst({
    where: { companyId, user: { email } },
    select: { id: true },
  });
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const config = await prisma.appPromotionConfig.findUnique({ where: { companyId } });

  let hostPage: { name: string | null; id: string } | null = null;
  try {
    const host = await getHostPlatform();
    hostPage = { name: host.pageName, id: host.pageId };
  } catch {
    hostPage = null;
  }

  const logs = await prisma.promoPostLog.findMany({
    include: { seenItem: true },
    orderBy: [{ slotDate: "desc" }, { slotIndex: "asc" }],
    take: 200,
  });

  const posts = logs.map((l) => ({
    id: l.id,
    seenItemId: l.seenItemId,
    slotDate: l.slotDate.toISOString(),
    slotIndex: l.slotIndex,
    scheduledFor: l.scheduledFor?.toISOString() || null,
    postedAt: l.postedAt?.toISOString() || null,
    updatedAt: l.updatedAt.toISOString(),
    status: l.status,
    facebookUrl: l.facebookUrl,
    errorMessage: l.errorMessage,
    title: l.seenItem.title,
    type: l.seenItem.externalType,
    sourceUrl: l.seenItem.sourceUrl,
    imageUrl: l.seenItem.imageUrl,
  }));

  const now = new Date();
  const rotationStart = config?.rotationStartedAt ?? now;
  const upcoming: UpcomingSlot[] = [];
  for (let d = 0; d < 14; d++) {
    const day = new Date(now);
    day.setUTCDate(day.getUTCDate() + d);
    if (!isPostingDay(rotationStart, day)) continue;
    for (const idx of [1, 2, 3] as const) {
      const w = getSlotWindow(idx, day);
      upcoming.push({
        date: day.toISOString().slice(0, 10),
        slotIndex: idx,
        startUtc: w.startUtc.toISOString(),
        endUtc: w.endUtc.toISOString(),
      });
    }
  }

  return NextResponse.json({
    enabled: config?.enabled ?? false,
    hostPage,
    posts,
    upcoming,
  });
}