// apps/web/src/lib/special-dates.ts
//
// Lunar-calendar holidays (Chinese New Year, Diwali, Eid, Ramadan, Holi,
// Hanukkah, Rosh Hashanah, Yom Kippur) shift each year. Dates below reflect
// 2026 and should be revisited annually until we integrate a proper
// holiday-calculation library.

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
  // ============================================================
  // SOUTH AFRICAN PUBLIC HOLIDAYS
  // ============================================================
  {
    id: 'ZA',
    label: 'South African Public Holidays',
    holidays: [
      { name: "New Year's Day", month: 1, day: 1, type: 'public', description: 'A fresh start to the year.', hashtags: ['HappyNewYear', 'NewYear'], tone: 'celebratory' },
      { name: 'Human Rights Day', month: 3, day: 21, type: 'public', description: 'Honouring the fight for equality and human dignity.', hashtags: ['HumanRightsDay', 'Equality'], tone: 'reflective' },
      { name: 'Good Friday', month: 4, day: 3, type: 'public', description: 'A solemn day of reflection.', hashtags: ['GoodFriday'], tone: 'reflective' },
      { name: 'Easter Sunday', month: 4, day: 5, type: 'observance', description: 'Celebrating hope and renewal.', hashtags: ['EasterSunday', 'HappyEaster'], tone: 'warm' },
      { name: 'Family Day', month: 4, day: 6, type: 'public', description: 'Time to cherish family and loved ones.', hashtags: ['FamilyDay', 'FamilyFirst'], tone: 'warm' },
      { name: 'Freedom Day', month: 4, day: 27, type: 'public', description: "Celebrating South Africa's democracy and freedom.", hashtags: ['FreedomDay', 'SouthAfrica'], tone: 'celebratory' },
      { name: "Workers' Day", month: 5, day: 1, type: 'public', description: 'Honouring the contributions of workers.', hashtags: ['WorkersDay', 'LabourDay'], tone: 'appreciative' },
      { name: 'Youth Day', month: 6, day: 16, type: 'public', description: 'Commemorating the courage of young South Africans.', hashtags: ['YouthDay', 'YouthPower'], tone: 'inspirational' },
      { name: 'Mandela Day', month: 7, day: 18, type: 'observance', description: "A day to serve others and honour Madiba's legacy.", hashtags: ['MandelaDay', '67Minutes'], tone: 'inspirational' },
      { name: "National Women's Day", month: 8, day: 9, type: 'public', description: 'Celebrating women and their achievements.', hashtags: ['WomensDay', 'WomensMonth'], tone: 'celebratory' },
      { name: 'Spring Day', month: 9, day: 1, type: 'observance', description: 'Welcoming a new season of growth.', hashtags: ['SpringDay', 'NewBeginnings'], tone: 'celebratory' },
      { name: 'Heritage Day', month: 9, day: 24, type: 'public', description: 'Embracing the diversity of South African culture.', hashtags: ['HeritageDay', 'ProudlySouthAfrican'], tone: 'celebratory' },
      { name: 'Day of Reconciliation', month: 12, day: 16, type: 'public', description: 'Reflecting on unity and reconciliation.', hashtags: ['ReconciliationDay'], tone: 'reflective' },
      { name: 'Christmas Eve', month: 12, day: 24, type: 'observance', description: 'Tis the season of giving and togetherness.', hashtags: ['ChristmasEve', 'FestiveSeason'], tone: 'warm' },
      { name: 'Christmas Day', month: 12, day: 25, type: 'public', description: 'Wishing everyone a joyful Christmas.', hashtags: ['MerryChristmas', 'ChristmasDay'], tone: 'warm' },
      { name: 'Day of Goodwill', month: 12, day: 26, type: 'public', description: 'Spreading kindness and goodwill.', hashtags: ['DayOfGoodwill'], tone: 'warm' },
    ],
  },

  // ============================================================
  // INTERNATIONAL AWARENESS DAYS
  // ============================================================
  {
    id: 'Global',
    label: 'International Awareness Days',
    holidays: [
      { name: 'World Cancer Day', month: 2, day: 4, type: 'observance', description: 'Raising awareness about cancer prevention.', hashtags: ['WorldCancerDay', 'CancerAwareness'], tone: 'educational' },
      { name: "Valentine's Day", month: 2, day: 14, type: 'observance', description: 'A day to celebrate love and connection.', hashtags: ['ValentinesDay', 'LoveAndKindness'], tone: 'warm' },
      { name: "International Women's Day", month: 3, day: 8, type: 'observance', description: 'Celebrating women globally and their achievements.', hashtags: ['IWD', 'InternationalWomensDay'], tone: 'celebratory' },
      { name: 'World Water Day', month: 3, day: 22, type: 'observance', description: 'Raising awareness about water conservation.', hashtags: ['WorldWaterDay', 'WaterConservation'], tone: 'educational' },
      { name: 'World Health Day', month: 4, day: 7, type: 'observance', description: 'Focusing on global health awareness.', hashtags: ['WorldHealthDay', 'HealthMatters'], tone: 'educational' },
      { name: 'Earth Day', month: 4, day: 22, type: 'observance', description: 'Protecting our planet for future generations.', hashtags: ['EarthDay', 'Sustainability'], tone: 'inspirational' },
      { name: "Mother's Day", month: 5, day: 11, type: 'observance', description: 'Honouring mothers and mother figures everywhere.', hashtags: ['MothersDay', 'MomsMatter'], tone: 'warm' },
      { name: 'World Environment Day', month: 6, day: 5, type: 'observance', description: 'Taking action for the environment.', hashtags: ['WorldEnvironmentDay', 'GreenFuture'], tone: 'inspirational' },
      { name: "Father's Day", month: 6, day: 15, type: 'observance', description: 'Celebrating fathers and father figures.', hashtags: ['FathersDay', 'DadsMatter'], tone: 'warm' },
      { name: 'World Mental Health Day', month: 10, day: 10, type: 'observance', description: 'Championing mental wellbeing for all.', hashtags: ['MentalHealthDay', 'EndTheStigma'], tone: 'educational' },
      { name: 'World Food Day', month: 10, day: 16, type: 'observance', description: 'Highlighting food security and sustainability.', hashtags: ['WorldFoodDay', 'ZeroHunger'], tone: 'educational' },
      { name: 'Halloween', month: 10, day: 31, type: 'observance', description: 'A night of costumes, creativity and fun.', hashtags: ['Halloween', 'SpookySeason'], tone: 'playful' },
      { name: 'World AIDS Day', month: 12, day: 1, type: 'observance', description: 'Uniting in the fight against HIV/AIDS.', hashtags: ['WorldAIDSDay', 'HIVAwareness'], tone: 'educational' },
    ],
  },

  // ============================================================
  // CULTURAL & INTERFAITH CELEBRATIONS
  // ============================================================
  {
    id: 'Cultural',
    label: 'Cultural & Faith Celebrations',
    holidays: [
      // Chinese / East Asian
      { name: 'Chinese New Year', month: 2, day: 17, type: 'observance', description: 'Welcoming the Lunar New Year with prosperity and joy.', hashtags: ['ChineseNewYear', 'LunarNewYear', 'GongXiFaCai'], tone: 'celebratory' },
      { name: 'Mid-Autumn Festival', month: 9, day: 25, type: 'observance', description: 'Celebrating family and the harvest moon.', hashtags: ['MidAutumnFestival', 'MooncakeFestival'], tone: 'warm' },

      // Hindu
      { name: 'Holi', month: 3, day: 4, type: 'observance', description: 'The festival of colours, love and spring.', hashtags: ['Holi', 'FestivalOfColours'], tone: 'playful' },
      { name: 'Diwali', month: 11, day: 8, type: 'observance', description: 'The festival of lights, celebrating victory of light over darkness.', hashtags: ['Diwali', 'FestivalOfLights'], tone: 'celebratory' },
      { name: 'Vaisakhi', month: 4, day: 14, type: 'observance', description: 'Sikh new year and harvest festival.', hashtags: ['Vaisakhi', 'SikhHeritage'], tone: 'celebratory' },

      // Islamic
      { name: 'Ramadan (Begins)', month: 2, day: 18, type: 'observance', description: 'A month of fasting, reflection and community.', hashtags: ['Ramadan', 'RamadanMubarak'], tone: 'reflective' },
      { name: 'Eid al-Fitr', month: 3, day: 20, type: 'observance', description: 'Celebrating the end of Ramadan.', hashtags: ['Eid', 'EidMubarak'], tone: 'celebratory' },
      { name: 'Eid al-Adha', month: 5, day: 27, type: 'observance', description: 'The festival of sacrifice and giving.', hashtags: ['EidAlAdha', 'EidMubarak'], tone: 'celebratory' },

      // Jewish
      { name: 'Rosh Hashanah', month: 9, day: 12, type: 'observance', description: 'The Jewish New Year, a time of reflection.', hashtags: ['RoshHashanah', 'ShanahTovah'], tone: 'reflective' },
      { name: 'Yom Kippur', month: 9, day: 21, type: 'observance', description: 'The Day of Atonement.', hashtags: ['YomKippur'], tone: 'reflective' },
      { name: 'Hanukkah', month: 12, day: 5, type: 'observance', description: 'The Festival of Lights.', hashtags: ['Hanukkah', 'FestivalOfLights'], tone: 'celebratory' },

      // Buddhist
      { name: 'Vesak', month: 5, day: 1, type: 'observance', description: 'Celebrating the birth, enlightenment and passing of the Buddha.', hashtags: ['Vesak', 'BuddhaDay'], tone: 'reflective' },
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