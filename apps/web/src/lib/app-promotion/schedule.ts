// apps/web/src/lib/app-promotion/schedule.ts

const SAST_OFFSET_MINUTES = 2 * 60; // SAST is UTC+2
const CYCLE_DAYS = 14;

export type SlotIndex = 1 | 2 | 3;

export interface SlotWindow {
  slotIndex: SlotIndex;
  startUtc: Date;
  endUtc: Date;
}

/**
 * SAST slot windows. These sit one hour after each CSHAD scrape run
 * (08:00, 12:00, 16:00 SAST), giving the scrape time to finish and the
 * plan-slot job time to populate the schedule before the window opens.
 *
 *   Slot 1: 09:00-11:00 SAST
 *   Slot 2: 13:00-15:00 SAST
 *   Slot 3: 17:00-19:00 SAST
 */
const SAST_SLOT_HOURS: Record<SlotIndex, [number, number]> = {
  1: [9, 11],
  2: [13, 15],
  3: [17, 19],
};

/**
 * Compute the slot window for a given SAST calendar date and slot index.
 * Returned times are UTC `Date` objects.
 */
export function getSlotWindow(slotIndex: SlotIndex, dateSast: Date): SlotWindow {
  const [startHour, endHour] = SAST_SLOT_HOURS[slotIndex];

  const year = dateSast.getUTCFullYear();
  const month = dateSast.getUTCMonth();
  const day = dateSast.getUTCDate();

  // Convert SAST hour to UTC by subtracting the offset
  const startUtc = new Date(
    Date.UTC(year, month, day, startHour - 2, 0, 0, 0)
  );
  const endUtc = new Date(Date.UTC(year, month, day, endHour - 2, 0, 0, 0));

  return { slotIndex, startUtc, endUtc };
}

/**
 * The 14-day posting cycle: posts occur on even-index days relative to the
 * rotation anchor. This yields one posting day, one skip day, repeating, so
 * all seven weekdays are covered across the cycle.
 */
export function isPostingDay(rotationStartedAt: Date, reference: Date): boolean {
  const startMs = Date.UTC(
    rotationStartedAt.getUTCFullYear(),
    rotationStartedAt.getUTCMonth(),
    rotationStartedAt.getUTCDate()
  );
  const refMs = Date.UTC(
    reference.getUTCFullYear(),
    reference.getUTCMonth(),
    reference.getUTCDate()
  );

  const daysDiff = Math.floor((refMs - startMs) / 86_400_000);
  const mod = ((daysDiff % CYCLE_DAYS) + CYCLE_DAYS) % CYCLE_DAYS;

  return mod % 2 === 0;
}

/**
 * Pick a target time within the slot window.
 *
 * v1: triangular distribution biased toward the middle of the window.
 * v2: will consume engagement data to drift toward the observed peak.
 */
export function pickSweetSpotTime(window: SlotWindow): Date {
  const totalMs = window.endUtc.getTime() - window.startUtc.getTime();
  const u1 = Math.random();
  const u2 = Math.random();
  const biased = (u1 + u2) / 2;
  return new Date(window.startUtc.getTime() + Math.floor(totalMs * biased));
}

/**
 * The UTC timestamp corresponding to 00:00 SAST today.
 */
export function startOfSastToday(reference: Date = new Date()): Date {
  const sastNow = new Date(reference.getTime() + SAST_OFFSET_MINUTES * 60_000);

  const sastMidnightAsUtc = new Date(
    Date.UTC(
      sastNow.getUTCFullYear(),
      sastNow.getUTCMonth(),
      sastNow.getUTCDate(),
      0,
      0,
      0,
      0
    )
  );

  return new Date(sastMidnightAsUtc.getTime() - SAST_OFFSET_MINUTES * 60_000);
}

/**
 * The SAST calendar date (as a UTC midnight Date) for a given reference.
 * Used for `slotDate` on `PromoPostLog`.
 */
export function sastDateOnly(reference: Date = new Date()): Date {
  const sastNow = new Date(reference.getTime() + SAST_OFFSET_MINUTES * 60_000);
  return new Date(
    Date.UTC(
      sastNow.getUTCFullYear(),
      sastNow.getUTCMonth(),
      sastNow.getUTCDate(),
      0,
      0,
      0,
      0
    )
  );
}