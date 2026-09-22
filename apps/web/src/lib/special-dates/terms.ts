// apps/web/src/lib/special-dates/terms.ts
// SA public school term definitions, hardcoded per year.
// Source: Department of Basic Education national framework.
// Provincial dates can differ by a few days. Update annually in December.
//
// The term scheduler handles full-term planning when there is enough runway.
// The manual scheduler handles individual holidays within the remainder of
// the CURRENT window only — never beyond, since planning further would
// collide with what the next term's scheduler will do.

import { getUpcomingSpecialDates, type Holiday } from '@/lib/special-dates';

export interface SaTerm {
  id: string;
  year: number;
  index: 1 | 2 | 3 | 4;
  label: string;
  start: Date;
  end: Date;
}

function d(y: number, m: number, day: number): Date {
  return new Date(y, m - 1, day, 0, 0, 0, 0);
}

/**
 * DBE national framework dates. Verified 2026, provisional 2027.
 * Review and refresh annually.
 */
export const SA_TERMS: SaTerm[] = [
  // ---- 2026 ----
  { id: '2026-T1', year: 2026, index: 1, label: 'Term 1, 2026', start: d(2026, 1, 14), end: d(2026, 3, 20) },
  { id: '2026-T2', year: 2026, index: 2, label: 'Term 2, 2026', start: d(2026, 4, 7),  end: d(2026, 6, 26) },
  { id: '2026-T3', year: 2026, index: 3, label: 'Term 3, 2026', start: d(2026, 7, 21), end: d(2026, 10, 2) },
  { id: '2026-T4', year: 2026, index: 4, label: 'Term 4, 2026', start: d(2026, 10, 13), end: d(2026, 12, 9) },
  // ---- 2027 (provisional) ----
  { id: '2027-T1', year: 2027, index: 1, label: 'Term 1, 2027', start: d(2027, 1, 13), end: d(2027, 3, 19) },
  { id: '2027-T2', year: 2027, index: 2, label: 'Term 2, 2027', start: d(2027, 4, 6),  end: d(2027, 6, 25) },
  { id: '2027-T3', year: 2027, index: 3, label: 'Term 3, 2027', start: d(2027, 7, 20), end: d(2027, 10, 1) },
  { id: '2027-T4', year: 2027, index: 4, label: 'Term 4, 2027', start: d(2027, 10, 12), end: d(2027, 12, 8) },
];

export function getTermById(id: string): SaTerm | null {
  return SA_TERMS.find((t) => t.id === id) || null;
}

/**
 * Current term resolver:
 *   - If now is inside a term's window, return that term
 *   - If now is between terms, return the next one
 *   - If now is after the last known term, return null
 */
export function getCurrentTerm(now: Date = new Date()): SaTerm | null {
  const sorted = [...SA_TERMS].sort(
    (a, b) => a.start.getTime() - b.start.getTime()
  );

  for (const term of sorted) {
    if (now >= term.start && now <= term.end) return term;
  }

  for (const term of sorted) {
    if (now < term.start) return term;
  }

  return null;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;
export const SHORT_WINDOW_DAYS = 14;

/**
 * Schedulable window — the range of dates the scheduler (term or manual) is
 * allowed to touch RIGHT NOW.
 *
 *   Inside a term:      [today, term.end]
 *   Between terms:      [today, day before next term starts]
 *   After last term:    null (caller should hide scheduling UI)
 *
 * The window never extends beyond the current term. Manual scheduling must
 * only touch holidays inside this range so it never collides with what the
 * next term's scheduler will do.
 */
export interface SchedulableWindow {
  start: Date;
  end: Date;
  daysRemaining: number;
  isShortWindow: boolean;
  term: SaTerm | null;
  isBetweenTerms: boolean;
}

export function getCurrentWindow(now: Date = new Date()): SchedulableWindow | null {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sorted = [...SA_TERMS].sort(
    (a, b) => a.start.getTime() - b.start.getTime()
  );

  // Inside a term?
  for (const term of sorted) {
    if (today >= term.start && today <= term.end) {
      const daysRemaining = Math.max(
        0,
        Math.ceil((term.end.getTime() - today.getTime()) / MS_PER_DAY)
      );
      return {
        start: today,
        end: term.end,
        daysRemaining,
        isShortWindow: daysRemaining < SHORT_WINDOW_DAYS,
        term,
        isBetweenTerms: false,
      };
    }
  }

  // Between terms? Window covers the break up to the day before next term.
  for (const term of sorted) {
    if (today < term.start) {
      const endOfBreak = new Date(term.start.getTime() - MS_PER_DAY);
      const daysRemaining = Math.max(
        0,
        Math.ceil((endOfBreak.getTime() - today.getTime()) / MS_PER_DAY)
      );
      return {
        start: today,
        end: endOfBreak,
        daysRemaining,
        isShortWindow: daysRemaining < SHORT_WINDOW_DAYS,
        term: null,
        isBetweenTerms: true,
      };
    }
  }

  return null;
}

export interface TermProgress {
  term: SaTerm;
  effectiveStart: Date;
  effectiveEnd: Date;
  daysRemaining: number;
  isMidTerm: boolean;
  canSchedule: boolean;
  blockReason?: string;
}

/**
 * Resolves the effective window for TERM scheduling within a term.
 * Term scheduling requires at least SHORT_WINDOW_DAYS of runway — shorter
 * windows should use the manual scheduler instead.
 */
export function getTermProgress(term: SaTerm, now: Date = new Date()): TermProgress {
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const isMidTerm = startOfToday > term.start;
  const effectiveStart = isMidTerm ? startOfToday : term.start;
  const effectiveEnd = term.end;

  const daysRemaining = Math.max(
    0,
    Math.ceil((effectiveEnd.getTime() - startOfToday.getTime()) / MS_PER_DAY)
  );

  const canSchedule = daysRemaining >= SHORT_WINDOW_DAYS;
  const blockReason = canSchedule
    ? undefined
    : `Only ${daysRemaining} day${daysRemaining === 1 ? '' : 's'} left in this term — too short for full-term scheduling. Use "Schedule individual holidays" below to handle the remainder.`;

  return {
    term,
    effectiveStart,
    effectiveEnd,
    daysRemaining,
    isMidTerm,
    canSchedule,
    blockReason,
  };
}

/**
 * Returns all holidays that fall within the given window, filtered by the
 * company's enabled holiday sets and excluded holiday names.
 *
 * This covers ALL enabled sets: ZA public holidays, Global awareness days,
 * and the cultural sets (Asia, India, Islam, Judaism). Whatever the user
 * enabled in Step 1 is what gets picked up here.
 */
export function getHolidaysInWindow(
  window: { start: Date; end: Date },
  selectedSets: string[],
  excludedHolidays: string[]
): Array<{ entry: Holiday; date: Date; setId: string }> {
  if (selectedSets.length === 0) return [];

  const now = new Date();
  const daysToEnd = Math.max(
    1,
    Math.ceil((window.end.getTime() - now.getTime()) / MS_PER_DAY)
  );
  const horizon = daysToEnd + 1;

  const upcoming = getUpcomingSpecialDates(
    selectedSets,
    horizon,
    now,
    excludedHolidays
  );

  return upcoming.filter(
    (h) => h.date >= window.start && h.date <= window.end
  );
}

/** Backwards-compatible alias for callers still using term-based filtering. */
export function getHolidaysInTerm(
  term: SaTerm,
  selectedSets: string[],
  excludedHolidays: string[]
): Array<{ entry: Holiday; date: Date; setId: string }> {
  return getHolidaysInWindow(
    { start: term.start, end: term.end },
    selectedSets,
    excludedHolidays
  );
}