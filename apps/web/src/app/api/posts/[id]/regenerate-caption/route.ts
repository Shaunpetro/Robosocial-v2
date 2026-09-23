// apps/web/src/app/api/posts/[id]/regenerate-caption/route.ts
// Regenerates the caption for an existing special-date post using the short
// caption generator. Updates the post's content + hashtags in place.
//
// Only works on posts whose topic matches a special-date definition. Other
// posts keep their manually-authored captions.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { HOLIDAY_SETS, type Holiday } from "@/lib/special-dates";
import { generateShortSpecialDateCaption } from "@/lib/ai/openai";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface HolidayMatch {
  entry: Holiday;
  setId: string;
}

function findHolidayByTopic(topic: string): HolidayMatch | null {
  for (const set of HOLIDAY_SETS) {
    const entry = set.holidays.find((h) => h.name === topic);
    if (entry) return { entry, setId: set.id };
  }
  return null;
}

const PLATFORM_KEYS: Record<string, "linkedin" | "twitter" | "facebook" | "instagram" | "wordpress"> = {
  LINKEDIN: "linkedin",
  FACEBOOK: "facebook",
  TWITTER: "twitter",
  INSTAGRAM: "instagram",
  WORDPRESS: "wordpress",
};

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const post = await prisma.generatedPost.findUnique({
      where: { id },
      include: {
        platform: true,
        company: { select: { name: true, industry: true } },
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (!post.topic) {
      return NextResponse.json(
        { error: "Post has no topic — cannot regenerate caption." },
        { status: 400 }
      );
    }

    const match = findHolidayByTopic(post.topic);
    if (!match) {
      return NextResponse.json(
        {
          error: `No special-date definition found for topic "${post.topic}". Regenerate caption only works on special-date posts.`,
        },
        { status: 400 }
      );
    }

    if (!post.platform) {
      return NextResponse.json(
        { error: "Post has no platform — cannot determine caption length." },
        { status: 400 }
      );
    }

    const platformKey = PLATFORM_KEYS[post.platform.type];
    if (!platformKey) {
      return NextResponse.json(
        { error: `Platform ${post.platform.type} is not supported for caption regeneration.` },
        { status: 400 }
      );
    }

    const result = await generateShortSpecialDateCaption({
      companyName: post.company?.name || "our company",
      companyIndustry: post.company?.industry || undefined,
      platform: platformKey,
      dateName: match.entry.name,
      dateDescription: match.entry.description,
      tone: post.tone || match.entry.tone || "warm",
      fallbackHashtags: match.entry.hashtags || [],
    });

    const updated = await prisma.generatedPost.update({
      where: { id },
      data: {
        content: result.content,
        hashtags: result.hashtags,
      },
      include: {
        platform: true,
        postMedia: {
          include: { media: true },
          orderBy: { order: "asc" },
        },
      },
    });

    console.log("[regenerate-caption] success", {
      postId: id,
      topic: post.topic,
      oldLength: post.content.length,
      newLength: result.characterCount,
    });

    return NextResponse.json({
      success: true,
      post: updated,
      content: result.content,
      hashtags: result.hashtags,
      characterCount: result.characterCount,
    });
  } catch (error) {
    console.error("Error regenerating caption:", error);
    return NextResponse.json(
      { error: "Failed to regenerate caption" },
      { status: 500 }
    );
  }
}