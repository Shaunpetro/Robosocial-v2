// apps/web/src/lib/app-promotion/select.ts
import type { PromoSeenItem } from "@prisma/client";

const TARGET_POSTS_PER_SLOT = 3;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Selects up to three items for a single slot from the given pool,
 * following the agreed priority order:
 *
 *   1. NEWS      — always included if available
 *   2. JOB       — always included if available
 *   3. TENDER or BURSARY — random pick between them
 *   4. Any remaining type — fill up to three
 *
 * Items are removed from the pool as they are selected, so a single item
 * can never occupy two slots.
 */
export function selectItemsForSlot(pool: PromoSeenItem[]): PromoSeenItem[] {
  const selected: PromoSeenItem[] = [];
  const remaining = [...pool];

  const take = (
    predicate: (item: PromoSeenItem) => boolean
  ): PromoSeenItem | null => {
    const idx = remaining.findIndex(predicate);
    if (idx === -1) return null;
    const [item] = remaining.splice(idx, 1);
    return item;
  };

  // Priority 1: NEWS
  const news = take((i) => i.externalType === "NEWS");
  if (news) selected.push(news);

  // Priority 2: JOB
  if (selected.length < TARGET_POSTS_PER_SLOT) {
    const job = take((i) => i.externalType === "JOB");
    if (job) selected.push(job);
  }

  // Priority 3: TENDER or BURSARY (random)
  if (selected.length < TARGET_POSTS_PER_SLOT) {
    const opps = remaining.filter(
      (i) => i.externalType === "TENDER" || i.externalType === "BURSARY"
    );
    const shuffled = shuffle(opps);
    for (const pick of shuffled) {
      if (selected.length >= TARGET_POSTS_PER_SLOT) break;
      const idx = remaining.findIndex((i) => i.id === pick.id);
      if (idx !== -1) {
        remaining.splice(idx, 1);
        selected.push(pick);
      }
    }
  }

  // Fill from anything left, newest first
  if (selected.length < TARGET_POSTS_PER_SLOT) {
    const fillers = [...remaining].sort(
      (a, b) =>
        (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0)
    );
    while (selected.length < TARGET_POSTS_PER_SLOT && fillers.length > 0) {
      selected.push(fillers.shift()!);
    }
  }

  return selected;
}