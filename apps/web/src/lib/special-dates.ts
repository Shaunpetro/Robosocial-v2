// apps/web/src/lib/special-dates.ts
export interface Holiday {
  name: string;
  month: number; // 1-12
  day: number;
  type: 'public' | 'observance';
}

export interface HolidaySet {
  id: string;
  label: string;
  holidays: Holiday[];
}

export const HOLIDAY_SETS: HolidaySet[] = [
  {
    id: 'ZA',
    label: 'South African Public Holidays',
    holidays: [
      { name: "New Year's Day", month: 1, day: 1, type: 'public' },
      { name: 'Human Rights Day', month: 3, day: 21, type: 'public' },
      { name: 'Good Friday', month: 4, day: 18, type: 'public' },
      { name: 'Family Day', month: 4, day: 21, type: 'public' },
      { name: 'Freedom Day', month: 4, day: 27, type: 'public' },
      { name: "Workers' Day", month: 5, day: 1, type: 'public' },
      { name: 'Youth Day', month: 6, day: 16, type: 'public' },
      { name: "National Women's Day", month: 8, day: 9, type: 'public' },
      { name: 'Heritage Day', month: 9, day: 24, type: 'public' },
      { name: 'Day of Reconciliation', month: 12, day: 16, type: 'public' },
      { name: 'Christmas Day', month: 12, day: 25, type: 'public' },
      { name: 'Day of Goodwill', month: 12, day: 26, type: 'public' },
    ],
  },
  {
    id: 'Global',
    label: 'International Awareness Days',
    holidays: [
      { name: 'World Water Day', month: 3, day: 22, type: 'observance' },
      { name: 'World Health Day', month: 4, day: 7, type: 'observance' },
      { name: 'Earth Day', month: 4, day: 22, type: 'observance' },
      { name: 'World Environment Day', month: 6, day: 5, type: 'observance' },
      { name: 'World Food Day', month: 10, day: 16, type: 'observance' },
    ],
  },
];

/**
 * Returns the next two upcoming special dates from the selected holiday sets.
 * @param selectedSets Array of holiday set IDs (e.g., ['ZA', 'Global'])
 * @param baseDate Optional base date; defaults to today.
 * @returns Array of { holiday, date } objects, sorted by date ascending.
 */
export function getUpcomingSpecialDates(
  selectedSets: string[],
  baseDate: Date = new Date()
): { holiday: Holiday; date: Date }[] {
  const today = new Date(baseDate);
  today.setHours(0, 0, 0, 0);
  const currentYear = today.getFullYear();

  const allHolidays: { holiday: Holiday; date: Date }[] = [];

  for (const setId of selectedSets) {
    const set = HOLIDAY_SETS.find((s) => s.id === setId);
    if (!set) continue;

    for (const holiday of set.holidays) {
      // Check this year's occurrence
      const dateThisYear = new Date(currentYear, holiday.month - 1, holiday.day);
      if (dateThisYear >= today) {
        allHolidays.push({ holiday, date: dateThisYear });
      }

      // Check next year's occurrence (in case we're late in the year)
      const dateNextYear = new Date(currentYear + 1, holiday.month - 1, holiday.day);
      allHolidays.push({ holiday, date: dateNextYear });
    }
  }

  // Sort by date ascending
  allHolidays.sort((a, b) => a.date.getTime() - b.date.getTime());

  // Return first two unique dates (avoid duplicates if same holiday appears multiple times)
  const unique: { holiday: Holiday; date: Date }[] = [];
  const seenDates = new Set<string>();
  for (const item of allHolidays) {
    const key = item.date.toISOString().slice(0, 10);
    if (!seenDates.has(key)) {
      seenDates.add(key);
      unique.push(item);
    }
    if (unique.length >= 2) break;
  }

  return unique;
}