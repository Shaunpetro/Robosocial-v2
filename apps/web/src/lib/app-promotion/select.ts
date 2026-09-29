// apps/web/src/lib/app-promotion/select.ts
import { prisma } from "@/lib/db";
import { startOfSastToday } from "./schedule";
import type { PromoItemType } from "./fetch-items";

export interface SelectableItem {
  id: string;
  externalType: PromoItemType;
  title: string;
  sourceUrl: string | null;
  imageUrl: string | null;
  sourceName: string | null;
  publishedAt: Date | null;
}

export interface SelectionResult {
  selected: SelectableItem[];
  poolSize: number;
  reason?: string;
}

const DEFAULT_MAX_ITEMS = 3;

function shuffle<T>(input: T[]): T[] {
  const copy = [...input];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Select up to `maxItems` items for a slot.
 *
 * Priority:
 *   1. NEWS (always, if available)
 *   2. JOB  (always, if available)
 *   3. TENDER | BURSARY (random pick; fills remaining capacity)
 *   4. Any remaining unposted item from the pool
 *
 * Pool is restricted to items first seen today (SAST) that have not yet
 * been posted. Items from previous days are intentionally excluded.
 */
export async function selectItemsForSlot(
  maxItems: number = DEFAULT_MAX_ITEMS
): Promise<SelectionResult> {
  const startOfToday = startOfSastToday();

  const pool = await prisma.promoSeenItem.findMany({
    where: {
      postedAt: null,
      firstSeenAt: { gte: startOfToday },
    },
    orderBy: { publishedAt: "desc" },
    select: {
      id: true,
      externalType: true,
      title: true,
      sourceUrl: true,
      imageUrl: true,
      sourceName: true,
      publishedAt: true,
    },
  });

  if (pool.length === 0) {
    return { selected: [], poolSize: 0, reason: "empty-pool" };
  }

  const selected: SelectableItem[] = [];
  const used = new Set<string>();

  const takeFirstOfType = (type: PromoItemType): boolean => {
    const candidate = pool.find(
      (item) => item.externalType === type && !used.has(item.id)
    );
    if (!candidate) return false;
    selected.push(candidate);
    used.add(candidate.id);
    return true;
  };

  takeFirstOfType("NEWS");

  if (selected.length < maxItems) {
    takeFirstOfType("JOB");
  }

  if (selected.length < maxItems) {
    const thirdTier = shuffle(
      pool.filter(
        (item) =>
          !used.has(item.id) &&
          (item.externalType === "TENDER" || item.externalType === "BURSARY")
      )
    );
    for (const item of thirdTier) {
      if (selected.length >= maxItems) break;
      selected.push(item);
      used.add(item.id);
    }
  }

  if (selected.length < maxItems) {
    const fillers = pool.filter((item) => !used.has(item.id));
    for (const item of fillers) {
      if (selected.length >= maxItems) break;
      selected.push(item);
      used.add(item.id);
    }
  }

  return { selected, poolSize: pool.length };
}