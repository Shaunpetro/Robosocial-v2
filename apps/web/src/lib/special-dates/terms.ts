// apps/web/src/lib/special-dates/terms.ts
// SA public school term definitions, hardcoded per year.
// Source: Department of Basic Education national framework.
// Provincial dates can differ by a few days. Update annually in December.
// Lunar-aware holiday placement uses lib/special-dates.ts — this file only
// defines the calendar windows.

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
 * These should be reviewed and refreshed annually.
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
 *   - If now is between terms, return the next one (we prepare ahead)
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

export interface TermProgress {
  term: SaTerm;
  effectiveStart: Date;
  effectiveEnd: Date;
  daysRemaining: number;
  isMidTerm: boolean;
  canSchedule: boolean;
  blockReason?: string;
}

const MIN_DAYS_TO_SCHEDULE = 14;

/**
 * Resolves the effective window for scheduling within a term.
 * If we're already inside the term, we only schedule from today forward.
 * If fewer than 14 days remain, we block — the user should wait and schedule
 * the next term instead.
 */
export function getTermProgress(term: SaTerm, now: Date = new Date()): TermProgress {
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const isMidTerm = startOfToday > term.start;
  const effectiveStart = isMidTerm ? startOfToday : term.start;
  const effectiveEnd = term.end;

  const msRemaining = effectiveEnd.getTime() - startOfToday.getTime();
  const daysRemaining = Math.max(0, Math.ceil(msRemaining / (24 * 60 * 60 * 1000)));

  const canSchedule = daysRemaining >= MIN_DAYS_TO_SCHEDULE;
  const blockReason = canSchedule
    ? undefined
    : `Only ${daysRemaining} day${daysRemaining === 1 ? '' : 's'} left in this term. Wait for the next term.`;

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
 * Returns all holidays that fall within the term window, filtered by the
 * company's enabled holiday sets and excluded holiday names.
 */
export function getHolidaysInTerm(
  term: SaTerm,
  selectedSets: string[],
  excludedHolidays: string[]
): Array<{ entry: Holiday; date: Date; setId: string }> {
  if (selectedSets.length === 0) return [];

  const now = new Date();
  const daysFromNow = Math.ceil(
    (term.end.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
  );
  const horizon = Math.max(daysFromNow + 1, 30);

  const upcoming = getUpcomingSpecialDates(
    selectedSets,
    horizon,
    now,
    excludedHolidays
  );

  return upcoming.filter((h) => h.date >= term.start && h.date <= term.end);
}