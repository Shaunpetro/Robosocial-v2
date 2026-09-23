// apps/web/src/app/api/posts/[id]/regenerate-media/route.ts
// Regenerates the branded media for a scheduled special-date post.
// Loads the post, looks up the holiday definition by topic, calls the
// shared media generator, and atomically swaps the PostMedia link.
// Old media is left in the library (tagged permanent) for reuse/cleanup.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { HOLIDAY_SETS, type Holiday } from "@/lib/special-dates";
import {
  generateSpecialDateMedia,
  GenerateSpecialDateMediaError,
} from "@/lib/special-dates/generate";

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

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const post = await prisma.generatedPost.findUnique({
      where: { id },
      include: {
        postMedia: true,
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (!post.topic) {
      return NextResponse.json(
        { error: "Post has no topic. Only special-date posts can be regenerated." },
        { status: 400 }
      );
    }

    const match = findHolidayByTopic(post.topic);
    if (!match) {
      return NextResponse.json(
        {
          error: `No special-date definition found for topic "${post.topic}". Only special-date posts can be regenerated.`,
        },
        { status: 400 }
      );
    }

    const displayDate = post.scheduledFor
      ? new Date(post.scheduledFor).toLocaleDateString("en-ZA", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : undefined;

    // 1. Generate the new media (may fail — no DB change on failure)
    let mediaResult: { mediaId: string; url: string };
    try {
      mediaResult = await generateSpecialDateMedia({
        companyId: post.companyId,
        holidayName: match.entry.name,
        holidayDate: displayDate,
        holidayMessage: `Happy ${match.entry.name}!`,
        holidayDescription: match.entry.description,
        holidayTone: match.entry.tone,
      });
    } catch (err) {
      if (err instanceof GenerateSpecialDateMediaError) {
        return NextResponse.json({ error: err.message }, { status: err.status });
      }
      throw err;
    }

    // 2. Atomically swap the PostMedia link
    await prisma.$transaction([
      prisma.postMedia.deleteMany({ where: { postId: id } }),
      prisma.postMedia.create({
        data: {
          postId: id,
          mediaId: mediaResult.mediaId,
          order: 0,
        },
      }),
    ]);

    // 3. Fetch the fresh post with relations
    const updated = await prisma.generatedPost.findUnique({
      where: { id },
      include: {
        platform: true,
        postMedia: {
          include: { media: true },
          orderBy: { order: "asc" },
        },
      },
    });

    console.log("[regenerate-media] success", {
      postId: id,
      topic: post.topic,
      newMediaId: mediaResult.mediaId,
      newUrl: mediaResult.url,
    });

    return NextResponse.json({
      success: true,
      post: updated,
      mediaId: mediaResult.mediaId,
      url: mediaResult.url,
    });
  } catch (error) {
    console.error("Error regenerating post media:", error);
    return NextResponse.json(
      { error: "Failed to regenerate media" },
      { status: 500 }
    );
  }
}