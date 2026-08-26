// apps/web/src/app/api/cron/media-cleanup/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { del } from "@vercel/blob";
import { sendMediaCleanupReminderEmail } from "@/lib/email";

const CRON_SECRET = process.env.CRON_SECRET ?? "";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    // Exclude permanent / specialâ€‘dates media
    const expiredMedia = await prisma.media.findMany({
      where: {
        createdAt: { lte: fourteenDaysAgo },
        NOT: {
          tags: { hasSome: ["special-dates", "permanent"] },
        },
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            owner: { select: { email: true } },
          },
        },
      },
    });

    console.log(`[MediaCleanup] Found ${expiredMedia.length} expired items`);

    const deletedIds: string[] = [];
    const companyMediaCounts = new Map<
      string,
      { email: string; name: string; deleted: number }
    >();

    for (const media of expiredMedia) {
      try {
        await del(media.url);
      } catch (blobError) {
        console.error(`Blob deletion failed for ${media.url}:`, blobError);
      }

      await prisma.media.delete({ where: { id: media.id } });
      deletedIds.push(media.id);

      const companyId = media.company.id;
      const existing = companyMediaCounts.get(companyId) || {
        email: media.company.owner?.email ?? "",
        name: media.company.name,
        deleted: 0,
      };
      existing.deleted += 1;
      companyMediaCounts.set(companyId, existing);
    }

    for (const [companyId, info] of companyMediaCounts) {
      const remainingCount = await prisma.media.count({ where: { companyId } });
      if (remainingCount === 0 && info.email) {
        try {
          await sendMediaCleanupReminderEmail(
            info.email,
            info.name,
            info.deleted
          );
        } catch (e) {
          console.error(
            `Failed to send cleanup reminder to ${info.email}:`,
            e
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      deleted: deletedIds.length,
      companiesNotified: companyMediaCounts.size,
    });
  } catch (error) {
    console.error("[MediaCleanup] Error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}