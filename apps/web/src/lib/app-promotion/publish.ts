// apps/web/src/lib/app-promotion/publish.ts
import { prisma } from "@/lib/db";
import { fetchRecentItems } from "./fetch-items";
import { diffAndInsertItems } from "./diff";
import { selectItemsForSlot } from "./select";
import { buildCaption, buildBridgeUrl } from "./caption";
import { getSlotWindow, sastDateOnly, isPostingDay } from "./schedule";
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

export interface PlanOptions {
  /**
   * When true, bypasses the posting-day rotation gate and the
   * past-window check. Intended for manual testing only. The idempotency
   * check for an already-planned slot still applies.
   */
  force?: boolean;
}

/**
 * Plan a slot: gate on posting day, confirm window is still ahead,
 * fetch from CSHAD, diff, select, and create PENDING logs with
 * scheduledFor timestamps distributed across the slot window.
 *
 * Idempotent: a second call for the same (slotDate, slotIndex) is a no-op.
 */
export async function planSlot(
  slotIndex: 1 | 2 | 3,
  options: PlanOptions = {}
): Promise<PlanResult> {
  const now = new Date();
  const slotDate = sastDateOnly(now);
  const { force = false } = options;

  // --- Rotation gate ---
  if (!force) {
    const config = await prisma.appPromotionConfig.findFirst({
      where: { enabled: true },
      orderBy: { rotationStartedAt: "asc" },
    });

    if (config && !isPostingDay(config.rotationStartedAt, now)) {
      return {
        planned: 0,
        skipped: true,
        reason: "not-a-posting-day",
        slotDate: slotDate.toISOString(),
        slotIndex,
      };
    }
  }

  // --- Past-window rejection ---
  const window = getSlotWindow(slotIndex, now);
  if (!force && window.startUtc.getTime() < now.getTime()) {
    return {
      planned: 0,
      skipped: true,
      reason: "slot-window-already-passed",
      slotDate: slotDate.toISOString(),
      slotIndex,
    };
  }

  // --- Idempotency: already planned ---
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

  // --- Fetch and diff ---
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

  // --- Distribute across the full slot window ---
  const totalMs = window.endUtc.getTime() - window.startUtc.getTime();
  const sliceMs = Math.floor(totalMs / selected.length);

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

/**
 * Publish the single oldest PENDING post whose scheduledFor time has
 * passed. One per call. This bounds each invocation well below the
 * Vercel function timeout and eliminates the risk of a Facebook post
 * succeeding while the database write fails.
 */
export async function executeDue(): Promise<ExecuteResult> {
  const now = new Date();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL;

  const due = await prisma.promoPostLog.findFirst({
    where: { status: "PENDING", scheduledFor: { lte: now } },
    include: { seenItem: true },
    orderBy: { scheduledFor: "asc" },
  });

  if (!due) {
    return { executed: 0, failed: 0, inspected: 0 };
  }

  const bridgeUrl = buildBridgeUrl(appUrl, due.seenItem.id);
  const caption = buildCaption({
    item: {
      id: due.seenItem.id,
      externalType: due.seenItem.externalType as any,
      title: due.seenItem.title,
      sourceUrl: due.seenItem.sourceUrl,
      imageUrl: due.seenItem.imageUrl,
      sourceName: due.seenItem.sourceName,
      publishedAt: due.seenItem.publishedAt,
    },
    bridgeUrl,
  });

  const mediaUrls: string[] = [];
  if (due.seenItem.externalType === "NEWS" && due.seenItem.imageUrl) {
    mediaUrls.push(due.seenItem.imageUrl);
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
          where: { id: due.id },
          data: {
            status: "POSTED",
            facebookPostId: result.postId,
            facebookUrl: result.postUrl || null,
            postedAt: new Date(),
          },
        }),
        prisma.promoSeenItem.update({
          where: { id: due.seenItem.id },
          data: { postedAt: new Date() },
        }),
      ]);
      return { executed: 1, failed: 0, inspected: 1 };
    }

    await prisma.promoPostLog.update({
      where: { id: due.id },
      data: {
        status: "FAILED",
        errorMessage: result.error || "Unknown error",
      },
    });
    return { executed: 0, failed: 1, inspected: 1 };
  } catch (e) {
    await prisma.promoPostLog.update({
      where: { id: due.id },
      data: {
        status: "FAILED",
        errorMessage: e instanceof Error ? e.message : "Unknown error",
      },
    });
    return { executed: 0, failed: 1, inspected: 1 };
  }
}