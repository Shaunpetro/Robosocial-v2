// apps/web/src/lib/special-dates.ts
//
// Lunar-calendar holidays shift each year. Dates below reflect 2026.

export type HolidayCategory = 'public' | 'awareness' | 'cultural' | 'religious' | 'commercial';

export interface Holiday {
  name: string;
  month: number;
  day: number;
  type: 'public' | 'observance';
  categories: HolidayCategory[];
  description: string;
  hashtags: string[];
  tone?: string;
  major?: boolean;
}

export interface HolidaySet {
  id: string;
  label: string;
  description: string;
  holidays: Holiday[];
}

export const HOLIDAY_SETS: HolidaySet[] = [
  // ============================================================
  // SOUTH AFRICAN PUBLIC HOLIDAYS
  // ============================================================
  {
    id: 'ZA',
    label: 'South African Public Holidays',
    description: 'National public holidays observed across South Africa.',
    holidays: [
      { name: "New Year's Day", month: 1, day: 1, type: 'public', categories: ['public'], description: 'A fresh start to the year.', hashtags: ['HappyNewYear', 'NewYear'], tone: 'celebratory', major: true },
      { name: 'Human Rights Day', month: 3, day: 21, type: 'public', categories: ['public', 'cultural'], description: 'Honouring the fight for equality and human dignity.', hashtags: ['HumanRightsDay', 'Equality'], tone: 'reflective' },
      { name: 'Good Friday', month: 4, day: 3, type: 'public', categories: ['religious'], description: 'A solemn day of reflection.', hashtags: ['GoodFriday'], tone: 'reflective' },
      { name: 'Easter Sunday', month: 4, day: 5, type: 'observance', categories: ['religious'], description: 'Celebrating hope and renewal.', hashtags: ['EasterSunday', 'HappyEaster'], tone: 'warm', major: true },
      { name: 'Family Day', month: 4, day: 6, type: 'public', categories: ['public', 'commercial'], description: 'Time to cherish family and loved ones.', hashtags: ['FamilyDay', 'FamilyFirst'], tone: 'warm' },
      { name: 'Freedom Day', month: 4, day: 27, type: 'public', categories: ['public', 'cultural'], description: "Celebrating South Africa's democracy and freedom.", hashtags: ['FreedomDay', 'SouthAfrica'], tone: 'celebratory' },
      { name: "Workers' Day", month: 5, day: 1, type: 'public', categories: ['public'], description: 'Honouring the contributions of workers.', hashtags: ['WorkersDay', 'LabourDay'], tone: 'appreciative' },
      { name: 'Youth Day', month: 6, day: 16, type: 'public', categories: ['public', 'cultural'], description: 'Commemorating the courage of young South Africans.', hashtags: ['YouthDay', 'YouthPower'], tone: 'inspirational' },
      { name: 'Mandela Day', month: 7, day: 18, type: 'observance', categories: ['cultural'], description: "A day to serve others and honour Madiba's legacy.", hashtags: ['MandelaDay', '67Minutes'], tone: 'inspirational' },
      { name: "National Women's Day", month: 8, day: 9, type: 'public', categories: ['public', 'cultural'], description: 'Celebrating women and their achievements.', hashtags: ['WomensDay', 'WomensMonth'], tone: 'celebratory', major: true },
      { name: 'Spring Day', month: 9, day: 1, type: 'observance', categories: ['cultural'], description: 'Welcoming a new season of growth.', hashtags: ['SpringDay', 'NewBeginnings'], tone: 'celebratory' },
      { name: 'Heritage Day', month: 9, day: 24, type: 'public', categories: ['public', 'cultural'], description: 'Embracing the diversity of South African culture.', hashtags: ['HeritageDay', 'ProudlySouthAfrican'], tone: 'celebratory', major: true },
      { name: 'Day of Reconciliation', month: 12, day: 16, type: 'public', categories: ['public', 'cultural'], description: 'Reflecting on unity and reconciliation.', hashtags: ['ReconciliationDay'], tone: 'reflective' },
      { name: 'Christmas Eve', month: 12, day: 24, type: 'observance', categories: ['religious', 'commercial'], description: 'Tis the season of giving and togetherness.', hashtags: ['ChristmasEve', 'FestiveSeason'], tone: 'warm' },
      { name: 'Christmas Day', month: 12, day: 25, type: 'public', categories: ['public', 'religious', 'commercial'], description: 'Wishing everyone a joyful Christmas.', hashtags: ['MerryChristmas', 'ChristmasDay'], tone: 'warm', major: true },
      { name: 'Day of Goodwill', month: 12, day: 26, type: 'public', categories: ['public', 'cultural'], description: 'Spreading kindness and goodwill.', hashtags: ['DayOfGoodwill'], tone: 'warm' },
    ],
  },

  // ============================================================
  // INTERNATIONAL AWARENESS DAYS
  // ============================================================
  {
    id: 'Global',
    label: 'International Awareness Days',
    description: 'Global awareness and commercial moments.',
    holidays: [
      { name: 'World Cancer Day', month: 2, day: 4, type: 'observance', categories: ['awareness'], description: 'Raising awareness about cancer prevention.', hashtags: ['WorldCancerDay', 'CancerAwareness'], tone: 'educational' },
      { name: "Valentine's Day", month: 2, day: 14, type: 'observance', categories: ['commercial', 'cultural'], description: 'A day to celebrate love and connection.', hashtags: ['ValentinesDay', 'LoveAndKindness'], tone: 'warm', major: true },
      { name: "International Women's Day", month: 3, day: 8, type: 'observance', categories: ['awareness', 'cultural'], description: 'Celebrating women globally and their achievements.', hashtags: ['IWD', 'InternationalWomensDay'], tone: 'celebratory' },
      { name: 'World Water Day', month: 3, day: 22, type: 'observance', categories: ['awareness'], description: 'Raising awareness about water conservation.', hashtags: ['WorldWaterDay', 'WaterConservation'], tone: 'educational' },
      { name: 'World Health Day', month: 4, day: 7, type: 'observance', categories: ['awareness'], description: 'Focusing on global health awareness.', hashtags: ['WorldHealthDay', 'HealthMatters'], tone: 'educational' },
      { name: 'Earth Day', month: 4, day: 22, type: 'observance', categories: ['awareness'], description: 'Protecting our planet for future generations.', hashtags: ['EarthDay', 'Sustainability'], tone: 'inspirational' },
      { name: "Mother's Day", month: 5, day: 11, type: 'observance', categories: ['commercial', 'cultural'], description: 'Honouring mothers and mother figures everywhere.', hashtags: ['MothersDay', 'MomsMatter'], tone: 'warm', major: true },
      { name: 'World Environment Day', month: 6, day: 5, type: 'observance', categories: ['awareness'], description: 'Taking action for the environment.', hashtags: ['WorldEnvironmentDay', 'GreenFuture'], tone: 'inspirational' },
      { name: "Father's Day", month: 6, day: 15, type: 'observance', categories: ['commercial', 'cultural'], description: 'Celebrating fathers and father figures.', hashtags: ['FathersDay', 'DadsMatter'], tone: 'warm', major: true },
      { name: 'World Mental Health Day', month: 10, day: 10, type: 'observance', categories: ['awareness'], description: 'Championing mental wellbeing for all.', hashtags: ['MentalHealthDay', 'EndTheStigma'], tone: 'educational' },
      { name: 'World Food Day', month: 10, day: 16, type: 'observance', categories: ['awareness'], description: 'Highlighting food security and sustainability.', hashtags: ['WorldFoodDay', 'ZeroHunger'], tone: 'educational' },
      { name: 'Halloween', month: 10, day: 31, type: 'observance', categories: ['commercial', 'cultural'], description: 'A night of costumes, creativity and fun.', hashtags: ['Halloween', 'SpookySeason'], tone: 'playful', major: true },
      { name: 'World AIDS Day', month: 12, day: 1, type: 'observance', categories: ['awareness'], description: 'Uniting in the fight against HIV/AIDS.', hashtags: ['WorldAIDSDay', 'HIVAwareness'], tone: 'educational' },
    ],
  },

  // ============================================================
  // CULTURAL — CHINESE & EAST ASIAN
  // ============================================================
  {
    id: 'Cultural-Asia',
    label: 'Chinese & East Asian',
    description: 'Lunar New Year and East Asian cultural celebrations.',
    holidays: [
      { name: 'Chinese New Year', month: 2, day: 17, type: 'observance', categories: ['cultural', 'religious'], description: 'Welcoming the Lunar New Year with prosperity and joy.', hashtags: ['ChineseNewYear', 'LunarNewYear', 'GongXiFaCai'], tone: 'celebratory', major: true },
      { name: 'Mid-Autumn Festival', month: 9, day: 25, type: 'observance', categories: ['cultural'], description: 'Celebrating family and the harvest moon.', hashtags: ['MidAutumnFestival', 'MooncakeFestival'], tone: 'warm' },
      { name: 'Vesak', month: 5, day: 1, type: 'observance', categories: ['religious', 'cultural'], description: 'Celebrating the birth, enlightenment and passing of the Buddha.', hashtags: ['Vesak', 'BuddhaDay'], tone: 'reflective' },
    ],
  },

  // ============================================================
  // CULTURAL — INDIAN & SOUTH ASIAN
  // ============================================================
  {
    id: 'Cultural-India',
    label: 'Indian & South Asian',
    description: 'Hindu and South Asian celebrations.',
    holidays: [
      { name: 'Holi', month: 3, day: 4, type: 'observance', categories: ['cultural', 'religious'], description: 'The festival of colours, love and spring.', hashtags: ['Holi', 'FestivalOfColours'], tone: 'playful', major: true },
      { name: 'Vaisakhi', month: 4, day: 14, type: 'observance', categories: ['cultural', 'religious'], description: 'Sikh new year and harvest festival.', hashtags: ['Vaisakhi', 'SikhHeritage'], tone: 'celebratory' },
      { name: 'Diwali', month: 11, day: 8, type: 'observance', categories: ['cultural', 'religious'], description: 'The festival of lights, celebrating victory of light over darkness.', hashtags: ['Diwali', 'FestivalOfLights'], tone: 'celebratory', major: true },
    ],
  },

  // ============================================================
  // CULTURAL — ISLAMIC
  // ============================================================
  {
    id: 'Cultural-Islam',
    label: 'Islamic Celebrations',
    description: 'Islamic holy months and festivals.',
    holidays: [
      { name: 'Ramadan (Begins)', month: 2, day: 18, type: 'observance', categories: ['religious'], description: 'A month of fasting, reflection and community.', hashtags: ['Ramadan', 'RamadanMubarak'], tone: 'reflective', major: true },
      { name: 'Eid al-Fitr', month: 3, day: 20, type: 'observance', categories: ['religious', 'cultural'], description: 'Celebrating the end of Ramadan.', hashtags: ['Eid', 'EidMubarak'], tone: 'celebratory', major: true },
      { name: 'Eid al-Adha', month: 5, day: 27, type: 'observance', categories: ['religious', 'cultural'], description: 'The festival of sacrifice and giving.', hashtags: ['EidAlAdha', 'EidMubarak'], tone: 'celebratory' },
    ],
  },

  // ============================================================
  // CULTURAL — JEWISH
  // ============================================================
  {
    id: 'Cultural-Judaism',
    label: 'Jewish Celebrations',
    description: 'Jewish high holidays and festivals.',
    holidays: [
      { name: 'Rosh Hashanah', month: 9, day: 12, type: 'observance', categories: ['religious'], description: 'The Jewish New Year, a time of reflection.', hashtags: ['RoshHashanah', 'ShanahTovah'], tone: 'reflective', major: true },
      { name: 'Yom Kippur', month: 9, day: 21, type: 'observance', categories: ['religious'], description: 'The Day of Atonement.', hashtags: ['YomKippur'], tone: 'reflective' },
      { name: 'Hanukkah', month: 12, day: 5, type: 'observance', categories: ['religious', 'cultural'], description: 'The Festival of Lights.', hashtags: ['Hanukkah', 'FestivalOfLights'], tone: 'celebratory', major: true },
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
  baseDate: Date = new Date(),
  excludedHolidays: string[] = []
): UpcomingSpecialDate[] {
  const today = new Date(baseDate);
  today.setHours(0, 0, 0, 0);
  const horizon = new Date(today);
  horizon.setDate(horizon.getDate() + daysAhead);
  horizon.setHours(23, 59, 59, 999);

  const currentYear = today.getFullYear();
  const results: UpcomingSpecialDate[] = [];
  const excludedSet = new Set(excludedHolidays);

  for (const setId of selectedSets) {
    const set = HOLIDAY_SETS.find((s) => s.id === setId);
    if (!set) continue;

    for (const holiday of set.holidays) {
      if (excludedSet.has(holiday.name)) continue;
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