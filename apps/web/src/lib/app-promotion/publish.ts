// apps/web/src/lib/app-promotion/publish.ts
import { prisma } from "@/lib/db";
import { fetchRecentItems } from "./fetch-items";
import { diffAndInsertItems } from "./diff";
import { selectItemsForSlot } from "./select";
import { buildCaption, buildBridgeUrl } from "./caption";
import { getSlotWindow, sastDateOnly } from "./schedule";
import { publishPromoToFacebook } from "./facebook";

const POSTS_PER_SLOT = 3;
const DEFAULT_APP_URL = "https://atg-robosocial-v2.vercel.app";

export interface PlanResult {
  planned: number;
  skipped: boolean;
  reason?: string;
  slotDate: string;
  slotIndex: number;
}

/**
 * Plan a slot: fetch from CSHAD, diff, select, and create PENDING logs with
 * scheduledFor timestamps. Idempotent — a second call for the same
 * (slotDate, slotIndex) is a no-op.
 */
export async function planSlot(slotIndex: 1 | 2 | 3): Promise<PlanResult> {
  const now = new Date();
  const slotDate = sastDateOnly(now);

  const existing = await prisma.promoPostLog.count({
    where: { slotDate, slotIndex },
  });
  if (existing > 0) {
    return {
      planned: 0,
      skipped: true,
      reason: "slot-already-planned",
      slotDate: slotDate.toISOString(),
      slotIndex,
    };
  }

  const items = await fetchRecentItems();
  await diffAndInsertItems(items);

  const { selected, reason } = await selectItemsForSlot(POSTS_PER_SLOT);
  if (selected.length === 0) {
    return {
      planned: 0,
      skipped: true,
      reason: reason || "empty-pool",
      slotDate: slotDate.toISOString(),
      slotIndex,
    };
  }

  const window = getSlotWindow(slotIndex, now);
  const sliceMs = Math.floor(
    Math.min(3_600_000, window.endUtc.getTime() - window.startUtc.getTime()) /
      selected.length
  );

  const rows = selected.map((item, i) => {
    const sliceStart = window.startUtc.getTime() + sliceMs * i;
    const jitter = Math.floor(Math.random() * sliceMs);
    return {
      seenItemId: item.id,
      slotDate,
      slotIndex,
      scheduledFor: new Date(sliceStart + jitter),
      status: "PENDING" as const,
    };
  });

  await prisma.promoPostLog.createMany({ data: rows });

  return {
    planned: rows.length,
    skipped: false,
    slotDate: slotDate.toISOString(),
    slotIndex,
  };
}

export interface ExecuteResult {
  executed: number;
  failed: number;
  inspected: number;
}

export async function executeDue(): Promise<ExecuteResult> {
  const now = new Date();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL;

  const due = await prisma.promoPostLog.findMany({
    where: { status: "PENDING", scheduledFor: { lte: now } },
    include: { seenItem: true },
    orderBy: { scheduledFor: "asc" },
    take: 10,
  });

  let executed = 0;
  let failed = 0;

  for (const log of due) {
    const bridgeUrl = buildBridgeUrl(appUrl, log.seenItem.id);
    const caption = buildCaption({
      item: {
        id: log.seenItem.id,
        externalType: log.seenItem.externalType as any,
        title: log.seenItem.title,
        sourceUrl: log.seenItem.sourceUrl,
        imageUrl: log.seenItem.imageUrl,
        sourceName: log.seenItem.sourceName,
        publishedAt: log.seenItem.publishedAt,
      },
      bridgeUrl,
    });

    const mediaUrls: string[] = [];
    if (log.seenItem.externalType === "NEWS" && log.seenItem.imageUrl) {
      mediaUrls.push(log.seenItem.imageUrl);
    }

    try {
      const result = await publishPromoToFacebook({
        content: caption,
        link: mediaUrls.length === 0 ? bridgeUrl : undefined,
        mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
      });

      if (result.success && result.postId) {
        await prisma.$transaction([
          prisma.promoPostLog.update({
            where: { id: log.id },
            data: {
              status: "POSTED",
              facebookPostId: result.postId,
              facebookUrl: result.postUrl || null,
              postedAt: new Date(),
            },
          }),
          prisma.promoSeenItem.update({
            where: { id: log.seenItem.id },
            data: { postedAt: new Date() },
          }),
        ]);
        executed++;
      } else {
        await prisma.promoPostLog.update({
          where: { id: log.id },
          data: {
            status: "FAILED",
            errorMessage: result.error || "Unknown error",
          },
        });
        failed++;
      }
    } catch (e) {
      await prisma.promoPostLog.update({
        where: { id: log.id },
        data: {
          status: "FAILED",
          errorMessage: e instanceof Error ? e.message : "Unknown error",
        },
      });
      failed++;
    }
  }

  return { executed, failed, inspected: due.length };
}