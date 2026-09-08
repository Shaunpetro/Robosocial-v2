// apps/web/src/lib/special-dates.ts
export interface HolidaySet {
  id: string;
  label: string;
  holidays: Holiday[];
}

export interface Holiday {
  name: string;
  month: number; // 1-12
  day: number;
  type: 'public' | 'observance';
}

export const HOLIDAY_SETS: HolidaySet[] = [
  {
    id: 'ZA',
    label: 'South African Public Holidays',
    holidays: [
      { name: 'New Year\'s Day', month: 1, day: 1, type: 'public' },
      { name: 'Human Rights Day', month: 3, day: 21, type: 'public' },
      { name: 'Good Friday', month: 4, day: 18, type: 'public' },
      { name: 'Family Day', month: 4, day: 21, type: 'public' },
      { name: 'Freedom Day', month: 4, day: 27, type: 'public' },
      { name: 'Workers\' Day', month: 5, day: 1, type: 'public' },
      { name: 'Youth Day', month: 6, day: 16, type: 'public' },
      { name: 'National Women\'s Day', month: 8, day: 9, type: 'public' },
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