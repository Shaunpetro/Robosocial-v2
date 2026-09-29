// apps/web/src/lib/app-promotion/diff.ts
import { prisma } from "@/lib/db";
import type { NormalisedItem, PromoItemType } from "./fetch-items";

export interface DiffResult {
  fetched: number;
  inserted: number;
  alreadySeen: number;
}

/**
 * Upsert fetched CSHAD items into `PromoSeenItem`.
 *
 * "Already seen" is keyed on the composite `(externalId, externalType)`.
 * Existing rows are never overwritten, so `firstSeenAt` and `postedAt` are
 * preserved across runs. This is the "compare to last scrape" model.
 */
export async function diffAndInsertItems(
  items: NormalisedItem[]
): Promise<DiffResult> {
  if (items.length === 0) {
    return { fetched: 0, inserted: 0, alreadySeen: 0 };
  }

  const externalIds = items.map((i) => i.externalId);

  const existing = await prisma.promoSeenItem.findMany({
    where: { externalId: { in: externalIds } },
    select: { externalId: true, externalType: true },
  });

  const existingKeys = new Set(
    existing.map((e) => `${e.externalType}:${e.externalId}`)
  );

  const toInsert = items.filter((i) => {
    const key = `${i.externalType as PromoItemType}:${i.externalId}`;
    return !existingKeys.has(key);
  });

  if (toInsert.length > 0) {
    await prisma.promoSeenItem.createMany({
      data: toInsert.map((i) => ({
        externalId: i.externalId,
        externalType: i.externalType,
        title: i.title.slice(0, 1000),
        sourceUrl: i.sourceUrl,
        imageUrl: i.imageUrl,
        sourceName: i.sourceName,
        publishedAt: i.publishedAt,
      })),
      skipDuplicates: true,
    });
  }

  return {
    fetched: items.length,
    inserted: toInsert.length,
    alreadySeen: items.length - toInsert.length,
  };
}