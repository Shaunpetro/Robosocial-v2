// apps/web/src/lib/app-promotion/diff.ts
import { prisma } from "@/lib/db";
import { PromoItemType } from "@prisma/client";
import type { FetchedItem } from "./fetch-items";

export interface DiffResult {
  newCount: number;
  skippedCount: number;
  totalFetched: number;
}

/**
 * Upserts fetched items into PromoSeenItem.
 *
 * Existing rows are left untouched — firstSeenAt and postedAt are never
 * overwritten. This is the "compare to last scrape" model: anything not
 * already known to Robosocial is treated as new.
 */
export async function upsertSeenItems(
  items: FetchedItem[]
): Promise<DiffResult> {
  if (items.length === 0) {
    return { newCount: 0, skippedCount: 0, totalFetched: 0 };
  }

  // Deduplicate the input itself, in case the CSHAD fetch returned
  // duplicates (e.g. news appearing in both RSS and NewsAPI feeds).
  const seenInputKeys = new Set<string>();
  const uniqueInput: FetchedItem[] = [];
  for (const item of items) {
    const key = `${item.externalType}|${item.externalId}`;
    if (seenInputKeys.has(key)) continue;
    seenInputKeys.add(key);
    uniqueInput.push(item);
  }

  // Find which are already in Robosocial
  const existing = await prisma.promoSeenItem.findMany({
    where: {
      OR: uniqueInput.map((i) => ({
        externalId: i.externalId,
        externalType: i.externalType as PromoItemType,
      })),
    },
    select: { externalId: true, externalType: true },
  });

  const existingKeys = new Set(
    existing.map((e) => `${e.externalType}|${e.externalId}`)
  );

  const toCreate = uniqueInput.filter(
    (i) => !existingKeys.has(`${i.externalType}|${i.externalId}`)
  );

  if (toCreate.length === 0) {
    return {
      newCount: 0,
      skippedCount: uniqueInput.length,
      totalFetched: items.length,
    };
  }

  await prisma.promoSeenItem.createMany({
    data: toCreate.map((i) => ({
      externalId: i.externalId,
      externalType: i.externalType as PromoItemType,
      title: i.title,
      sourceUrl: i.sourceUrl,
      imageUrl: i.imageUrl,
      sourceName: i.sourceName,
      publishedAt: i.publishedAt,
    })),
    skipDuplicates: true,
  });

  return {
    newCount: toCreate.length,
    skippedCount: uniqueInput.length - toCreate.length,
    totalFetched: items.length,
  };
}