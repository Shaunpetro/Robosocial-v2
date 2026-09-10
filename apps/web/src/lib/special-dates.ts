// apps/web/src/lib/special-dates.ts
export interface Holiday {
  name: string;
  month: number;
  day: number;
  type: 'public' | 'observance';
  description: string;
  hashtags: string[];
  tone?: string;
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
      { name: "New Year's Day", month: 1, day: 1, type: 'public', description: 'A fresh start to the year.', hashtags: ['HappyNewYear', 'NewYear'], tone: 'celebratory' },
      { name: 'Human Rights Day', month: 3, day: 21, type: 'public', description: 'Honouring the fight for equality and human dignity.', hashtags: ['HumanRightsDay', 'Equality'], tone: 'reflective' },
      { name: 'Good Friday', month: 4, day: 18, type: 'public', description: 'A solemn day of reflection.', hashtags: ['GoodFriday'], tone: 'reflective' },
      { name: 'Family Day', month: 4, day: 21, type: 'public', description: 'Time to cherish family and loved ones.', hashtags: ['FamilyDay', 'FamilyFirst'], tone: 'warm' },
      { name: 'Freedom Day', month: 4, day: 27, type: 'public', description: "Celebrating South Africa's democracy and freedom.", hashtags: ['FreedomDay', 'SouthAfrica'], tone: 'celebratory' },
      { name: "Workers' Day", month: 5, day: 1, type: 'public', description: 'Honouring the contributions of workers.', hashtags: ['WorkersDay', 'LabourDay'], tone: 'appreciative' },
      { name: 'Youth Day', month: 6, day: 16, type: 'public', description: 'Commemorating the courage of young South Africans.', hashtags: ['YouthDay', 'YouthPower'], tone: 'inspirational' },
      { name: "National Women's Day", month: 8, day: 9, type: 'public', description: 'Celebrating women and their achievements.', hashtags: ['WomensDay', 'WomensMonth'], tone: 'celebratory' },
      { name: 'Heritage Day', month: 9, day: 24, type: 'public', description: 'Embracing the diversity of South African culture.', hashtags: ['HeritageDay', 'ProudlySouthAfrican'], tone: 'celebratory' },
      { name: 'Day of Reconciliation', month: 12, day: 16, type: 'public', description: 'Reflecting on unity and reconciliation.', hashtags: ['ReconciliationDay'], tone: 'reflective' },
      { name: 'Christmas Day', month: 12, day: 25, type: 'public', description: 'Wishing everyone a joyful Christmas.', hashtags: ['MerryChristmas', 'ChristmasDay'], tone: 'warm' },
      { name: 'Day of Goodwill', month: 12, day: 26, type: 'public', description: 'Spreading kindness and goodwill.', hashtags: ['DayOfGoodwill'], tone: 'warm' },
    ],
  },
  {
    id: 'Global',
    label: 'International Awareness Days',
    holidays: [
      { name: 'World Water Day', month: 3, day: 22, type: 'observance', description: 'Raising awareness about water conservation.', hashtags: ['WorldWaterDay', 'WaterConservation'], tone: 'educational' },
      { name: 'World Health Day', month: 4, day: 7, type: 'observance', description: 'Focusing on global health awareness.', hashtags: ['WorldHealthDay', 'HealthMatters'], tone: 'educational' },
      { name: 'Earth Day', month: 4, day: 22, type: 'observance', description: 'Protecting our planet for future generations.', hashtags: ['EarthDay', 'Sustainability'], tone: 'inspirational' },
      { name: 'World Environment Day', month: 6, day: 5, type: 'observance', description: 'Taking action for the environment.', hashtags: ['WorldEnvironmentDay', 'GreenFuture'], tone: 'inspirational' },
      { name: 'World Food Day', month: 10, day: 16, type: 'observance', description: 'Highlighting food security and sustainability.', hashtags: ['WorldFoodDay', 'ZeroHunger'], tone: 'educational' },
    ],
  },
];

export interface UpcomingSpecialDate {
  entry: Holiday;
  date: Date;
  setId: string;
}

export function getUpcomingSpecialDates(
  selectedSets: string[],
  daysAhead: number = 14,
  baseDate: Date = new Date()
): UpcomingSpecialDate[] {
  const today = new Date(baseDate);
  today.setHours(0, 0, 0, 0);
  const horizon = new Date(today);
  horizon.setDate(horizon.getDate() + daysAhead);
  horizon.setHours(23, 59, 59, 999);

  const currentYear = today.getFullYear();
  const results: UpcomingSpecialDate[] = [];

  for (const setId of selectedSets) {
    const set = HOLIDAY_SETS.find((s) => s.id === setId);
    if (!set) continue;

    for (const holiday of set.holidays) {
      for (const year of [currentYear, currentYear + 1]) {
        const date = new Date(year, holiday.month - 1, holiday.day);
        if (date >= today && date <= horizon) {
          results.push({ entry: holiday, date, setId });
        }
      }
    }
  }

  results.sort((a, b) => a.date.getTime() - b.date.getTime());
  return results;
}