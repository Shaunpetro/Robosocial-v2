// apps/web/src/lib/app-promotion/schedule.ts

const CYCLE_DAYS = 14;
const POSTING_INTERVAL_DAYS = 2;

export interface SlotWindow {
  index: 1 | 2 | 3;
  startUtcHour: number;
  endUtcHour: number;
}

/**
 * Slot windows in UTC. SAST is UTC+2 with no DST.
 *
 *   Slot 1: 08:00-10:00 SAST -> 06:00-08:00 UTC
 *   Slot 2: 12:00-14:00 SAST -> 10:00-12:00 UTC
 *   Slot 3: 16:00-18:00 SAST -> 14:00-16:00 UTC
 */
export const SLOT_WINDOWS: SlotWindow[] = [
  { index: 1, startUtcHour: 6, endUtcHour: 8 },
  { index: 2, startUtcHour: 10, endUtcHour: 12 },
  { index: 3, startUtcHour: 14, endUtcHour: 16 },
];

/**
 * Returns true if the given moment falls on a posting day within the
 * 14-day cycle. Posting days are every other day starting from
 * rotationStartedAt. Over 14 days, seven days are posting days.
 */
export function isPostingDay(
  rotationStartedAt: Date,
  now: Date = new Date()
): boolean {
  const ms = now.getTime() - rotationStartedAt.getTime();
  const days = Math.floor(ms / 86_400_000);
  const cycleDay = ((days % CYCLE_DAYS) + CYCLE_DAYS) % CYCLE_DAYS;
  return cycleDay % POSTING_INTERVAL_DAYS === 0;
}

export function getSlotWindow(index: 1 | 2 | 3): SlotWindow {
  const w = SLOT_WINDOWS.find((s) => s.index === index);
  if (!w) throw new Error(`Invalid slot index: ${index}`);
  return w;
}

/**
 * Returns the current slot index (1, 2, or 3) if the given moment is inside
 * a slot window, or null otherwise. Used by the run-slot route to validate
 * that the caller is inside an allowed window.
 */
export function getCurrentSlotIndex(now: Date = new Date()): 1 | 2 | 3 | null {
  const hour = now.getUTCHours();
  for (const w of SLOT_WINDOWS) {
    if (hour >= w.startUtcHour && hour < w.endUtcHour) return w.index;
  }
  return null;
}

/**
 * Picks a random time within the given slot window, biased toward the
 * middle so that posts do not cluster at the window edges. Returns a
 * Date in UTC.
 *
 * This is the "sweet spot" picker for v1. v2 will replace the randomness
 * with a learned distribution from engagement analytics.
 */
export function pickSweetSpotTime(
  window: SlotWindow,
  now: Date = new Date()
): Date {
  const windowMinutes = (window.endUtcHour - window.startUtcHour) * 60;

  // Triangular distribution: average of two uniforms peaks at 0.5.
  const u1 = Math.random();
  const u2 = Math.random();
  const centreBias = (u1 + u2) / 2;

  const minutesIn = Math.floor(centreBias * windowMinutes);

  const target = new Date(now);
  target.setUTCHours(window.startUtcHour, 0, 0, 0);
  target.setUTCMinutes(target.getUTCMinutes() + minutesIn);

  // Never schedule in the past
  if (target.getTime() <= now.getTime()) {
    target.setTime(now.getTime() + 60_000);
  }

  return target;
}