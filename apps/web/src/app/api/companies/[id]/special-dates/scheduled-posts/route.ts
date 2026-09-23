// apps/web/src/app/api/companies/[id]/special-dates/scheduled-posts/route.ts
// Returns every scheduled or published special-date post for a company.
// Used by the "Upcoming" card and the "Scheduled special dates" list.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkCompanyAccess } from "@/lib/access";

export const runtime = "nodejs";

const PLATFORM_LABELS: Record<string, string> = {
  LINKEDIN: "LinkedIn",
  FACEBOOK: "Facebook",
  TWITTER: "X",
  INSTAGRAM: "Instagram",
  WORDPRESS: "WordPress",
};

const PLATFORM_CAPTION_MAX: Record<string, number> = {
  LINKEDIN: 210,
  FACEBOOK: 200,
  TWITTER: 240,
  INSTAGRAM: 220,
  WORDPRESS: 500,
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: companyId } = await params;

  const access = await checkCompanyAccess(companyId);
  if (!access.allowed) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  try {
    const posts = await prisma.generatedPost.findMany({
      where: {
        companyId,
        generatedBy: { startsWith: "special-dates" },
        status: { not: "FAILED" },
      },
      include: {
        platform: true,
        postMedia: {
          include: { media: true },
          orderBy: { order: "asc" },
          take: 1,
        },
      },
      orderBy: { scheduledFor: "asc" },
    });

    const now = Date.now();

    const shaped = posts.map((p) => {
      const firstMedia = p.postMedia[0]?.media || null;
      const platformType = p.platform?.type || "FACEBOOK";
      const scheduledTime = p.scheduledFor ? new Date(p.scheduledFor).getTime() : 0;
      const isPast = scheduledTime > 0 && scheduledTime < now;

      return {
        postId: p.id,
        topic: p.topic || "Special date",
        scheduledFor: p.scheduledFor ? p.scheduledFor.toISOString() : null,
        isoDate: p.scheduledFor
          ? p.scheduledFor.toISOString().slice(0, 10)
          : null,
        status: p.status,
        content: p.content,
        hashtags: p.hashtags,
        platformId: p.platformId,
        platformType,
        platformLabel: PLATFORM_LABELS[platformType] || platformType,
        captionMax: PLATFORM_CAPTION_MAX[platformType] || 200,
        mediaId: firstMedia?.id || null,
        mediaUrl: firstMedia?.url || null,
        isPast,
      };
    });

    return NextResponse.json({ posts: shaped });
  } catch (error) {
    console.error("[scheduled-posts] failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load" },
      { status: 500 }
    );
  }
}