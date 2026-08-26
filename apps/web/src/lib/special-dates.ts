// apps/web/src/lib/special-dates.ts

/**
 * Special Dates Library â€“ Curated awareness days and public holidays
 * Grouped by region/theme sets for perâ€‘company selection.
 *
 * Each entry:
 *   - date: "MM-DD" (or full ISO for rare oneâ€‘offs)
 *   - name: display name
 *   - description: short context for AI prompts
 *   - hashtags: suggested hashtags
 *   - tone: optional tone override
 *   - regions: optional region tags (unused for now; all selection is by set)
 */

export interface SpecialDateEntry {
    date: string;          // "MM-DD"
    name: string;
    description: string;
    hashtags: string[];
    tone?: string;
  }
  
  export interface HolidaySet {
    id: string;
    label: string;
    dates: SpecialDateEntry[];
  }
  
  export const HOLIDAY_SETS: HolidaySet[] = [
    {
      id: "ZA",
      label: "South African Public Holidays",
      dates: [
        { date: "01-01", name: "New Year's Day", description: "Start of the new year.", hashtags: ["NewYear", "Hello2026", "FreshStart"] },
        { date: "03-21", name: "Human Rights Day", description: "Commemorates the Sharpeville massacre and human rights in SA.", hashtags: ["HumanRightsDay", "Sharpeville", "Equality"], tone: "professional" },
        { date: "04-07", name: "Good Friday", description: "Christian holiday commemorating the crucifixion.", hashtags: ["GoodFriday", "EasterWeekend"] },
        { date: "04-10", name: "Family Day", description: "Easter Monday â€“ a day for family and rest.", hashtags: ["FamilyDay", "EasterMonday", "QualityTime"] },
        { date: "04-27", name: "Freedom Day", description: "Commemorates the first democratic elections in 1994.", hashtags: ["FreedomDay", "Democracy", "ProudlySA"], tone: "professional" },
        { date: "05-01", name: "Workers' Day", description: "International workers' day â€“ celebrates labour rights.", hashtags: ["WorkersDay", "LabourRights", "EssentialWorkers"] },
        { date: "06-16", name: "Youth Day", description: "Commemorates the Soweto uprising of 1976.", hashtags: ["YouthDay", "Soweto", "FutureLeaders"], tone: "motivational" },
        { date: "07-18", name: "Mandela Day", description: "67 minutes of service for Nelson Mandela's birthday.", hashtags: ["MandelaDay", "67Minutes", "MakeADifference"], tone: "motivational" },
        { date: "08-09", name: "National Women's Day", description: "Commemorates the 1956 women's march.", hashtags: ["WomensDay", "WomensMonth", "Empowerment"], tone: "motivational" },
        { date: "09-24", name: "Heritage Day", description: "Celebrates South African culture and heritage â€“ Braai Day.", hashtags: ["HeritageDay", "BraaiDay", "ProudlySA"], tone: "casual" },
        { date: "12-16", name: "Day of Reconciliation", description: "Promotes reconciliation and national unity.", hashtags: ["ReconciliationDay", "Unity", "BetterTogether"], tone: "professional" },
        { date: "12-25", name: "Christmas Day", description: "Christian celebration of Christmas.", hashtags: ["MerryChristmas", "HolidaySeason", "FamilyTime"] },
        { date: "12-26", name: "Day of Goodwill", description: "Boxing Day â€“ a day of giving and rest.", hashtags: ["DayOfGoodwill", "BoxingDay", "GiveBack"] },
      ],
    },
    {
      id: "Global",
      label: "Major International Awareness Days",
      dates: [
        { date: "01-04", name: "World Braille Day", description: "Awareness of Braille as a communication medium for blind and partially sighted people.", hashtags: ["WorldBrailleDay", "Accessibility", "Inclusion"] },
        { date: "02-04", name: "World Cancer Day", description: "Global initiative to unite against cancer.", hashtags: ["WorldCancerDay", "CancerAwareness", "CloseTheCareGap"] },
        { date: "02-11", name: "International Day of Women and Girls in Science", description: "Promoting full and equal access to science for women and girls.", hashtags: ["WomenInScience", "STEM", "GirlsInSTEM"] },
        { date: "02-14", name: "Valentine's Day", description: "Celebration of love and affection.", hashtags: ["ValentinesDay", "Love", "ShareTheLove"], tone: "friendly" },
        { date: "03-08", name: "International Women's Day", description: "Celebrating the social, economic, cultural, and political achievements of women.", hashtags: ["IWD", "InternationalWomensDay", "EmbraceEquity"], tone: "motivational" },
        { date: "03-20", name: "International Day of Happiness", description: "Promotes happiness as a fundamental human goal.", hashtags: ["InternationalDayOfHappiness", "Happiness", "Wellbeing"], tone: "casual" },
        { date: "03-22", name: "World Water Day", description: "Focuses on the importance of freshwater.", hashtags: ["WorldWaterDay", "WaterIsLife", "SaveWater"] },
        { date: "04-07", name: "World Health Day", description: "Global health awareness under a specific WHO theme.", hashtags: ["WorldHealthDay", "GlobalHealth", "HealthyLiving"] },
        { date: "04-22", name: "Earth Day", description: "Demonstrates support for environmental protection.", hashtags: ["EarthDay", "Sustainability", "ClimateAction"], tone: "professional" },
        { date: "05-17", name: "World Telecommunication and Information Society Day", description: "Highlights the importance of ICT and the Internet.", hashtags: ["WTISD", "DigitalInclusion", "Connectivity"] },
        { date: "06-05", name: "World Environment Day", description: "Encourages worldwide awareness and action for the environment.", hashtags: ["WorldEnvironmentDay", "OnlyOneEarth", "Sustainability"] },
        { date: "06-08", name: "World Oceans Day", description: "Raises awareness about the importance of oceans.", hashtags: ["WorldOceansDay", "SaveOurOceans", "BluePlanet"] },
        { date: "09-21", name: "International Day of Peace", description: "Strengthening the ideals of peace.", hashtags: ["PeaceDay", "GlobalPeace", "NonViolence"] },
        { date: "10-10", name: "World Mental Health Day", description: "Raises awareness of mental health issues.", hashtags: ["WorldMentalHealthDay", "MentalHealthMatters", "EndTheStigma"], tone: "professional" },
        { date: "10-16", name: "World Food Day", description: "Awareness of hunger and food security.", hashtags: ["WorldFoodDay", "ZeroHunger", "FoodSecurity"] },
        { date: "11-19", name: "International Men's Day", description: "Focus on men's health, positive role models, and gender equality.", hashtags: ["InternationalMensDay", "PositiveMasculinity", "MensHealth"] },
        { date: "12-01", name: "World AIDS Day", description: "Supporting people living with HIV and commemorating those who have died.", hashtags: ["WorldAIDSDay", "EndAIDS", "HIVAwareness"] },
        { date: "12-10", name: "Human Rights Day", description: "Anniversary of the Universal Declaration of Human Rights.", hashtags: ["HumanRightsDay", "UDHR", "StandUp4HumanRights"] },
      ],
    },
    {
      id: "US",
      label: "United States Holidays",
      dates: [
        { date: "01-01", name: "New Year's Day", description: "Start of the new year.", hashtags: ["NewYear", "Hello2026"] },
        { date: "07-04", name: "Independence Day", description: "US Independence Day â€“ 4th of July.", hashtags: ["IndependenceDay", "FourthOfJuly", "USA"], tone: "casual" },
        { date: "11-26", name: "Thanksgiving Day", description: "US Thanksgiving â€“ a day of gratitude and family.", hashtags: ["Thanksgiving", "Gratitude", "Thankful"], tone: "friendly" },
        { date: "12-25", name: "Christmas Day", description: "Christian celebration of Christmas.", hashtags: ["MerryChristmas", "HolidaySeason"] },
      ],
    },
    {
      id: "UK",
      label: "United Kingdom Bank Holidays",
      dates: [
        { date: "01-01", name: "New Year's Day", description: "Start of the new year.", hashtags: ["NewYear", "Hello2026"] },
        { date: "04-07", name: "Good Friday", description: "Christian holiday.", hashtags: ["GoodFriday", "EasterWeekend"] },
        { date: "04-10", name: "Easter Monday", description: "Bank holiday.", hashtags: ["EasterMonday"] },
        { date: "05-01", name: "Early May Bank Holiday", description: "May Day bank holiday.", hashtags: ["BankHoliday", "MayDay"] },
        { date: "12-25", name: "Christmas Day", description: "Christmas celebration.", hashtags: ["MerryChristmas"] },
        { date: "12-26", name: "Boxing Day", description: "Postâ€‘Christmas bank holiday.", hashtags: ["BoxingDay", "HolidaySeason"] },
      ],
    },
    {
      id: "CN",
      label: "Chinese Holidays",
      dates: [
        { date: "01-22", name: "Chinese New Year (Spring Festival)", description: "Most important Chinese festival â€“ year of the Dragon.", hashtags: ["ChineseNewYear", "SpringFestival", "YearOfTheDragon"], tone: "friendly" },
        { date: "02-05", name: "Lantern Festival", description: "End of the Spring Festival celebrations.", hashtags: ["LanternFestival", "ChineseCulture"] },
        { date: "04-05", name: "Qingming Festival", description: "Tombâ€‘sweeping day to honour ancestors.", hashtags: ["Qingming", "AncestorRespect"] },
        { date: "09-10", name: "Midâ€‘Autumn Festival", description: "Mooncake festival â€“ family reunion.", hashtags: ["MidAutumnFestival", "Mooncake", "FamilyReunion"] },
      ],
    },
    {
      id: "IN",
      label: "Indian Festivals",
      dates: [
        { date: "01-14", name: "Makar Sankranti", description: "Harvest festival celebrated across India.", hashtags: ["MakarSankranti", "FestivalOfHarvest"] },
        { date: "03-08", name: "Holi", description: "Festival of colours â€“ celebrating spring and love.", hashtags: ["Holi", "FestivalOfColours", "SpringCelebration"], tone: "casual" },
        { date: "08-15", name: "Independence Day", description: "India's Independence Day.", hashtags: ["IndependenceDay", "India", "Freedom"] },
        { date: "10-02", name: "Gandhi Jayanti", description: "Birthday of Mahatma Gandhi.", hashtags: ["GandhiJayanti", "MahatmaGandhi", "Peace"] },
        { date: "11-12", name: "Diwali", description: "Festival of lights â€“ celebration of good over evil.", hashtags: ["Diwali", "FestivalOfLights", "Prosperity"], tone: "friendly" },
      ],
    },
    {
      id: "AU",
      label: "Australian Public Holidays",
      dates: [
        { date: "01-01", name: "New Year's Day", description: "Start of the new year.", hashtags: ["NewYear", "Hello2026"] },
        { date: "01-26", name: "Australia Day", description: "Marks the arrival of the First Fleet.", hashtags: ["AustraliaDay", "OzDay", "AussiePride"] },
        { date: "04-07", name: "Good Friday", description: "Christian holiday.", hashtags: ["GoodFriday", "EasterWeekend"] },
        { date: "04-10", name: "Easter Monday", description: "Easter public holiday.", hashtags: ["EasterMonday"] },
        { date: "12-25", name: "Christmas Day", description: "Christmas celebration.", hashtags: ["MerryChristmas"] },
        { date: "12-26", name: "Boxing Day", description: "Postâ€‘Christmas public holiday.", hashtags: ["BoxingDay"] },
      ],
    },
    {
      id: "Africa",
      label: "Panâ€‘African Holidays",
      dates: [
        { date: "05-25", name: "Africa Day", description: "Commemorates the founding of the African Union.", hashtags: ["AfricaDay", "OneAfrica", "AfCFTA"], tone: "professional" },
        { date: "07-01", name: "African Union Day", description: "Celebration of African unity.", hashtags: ["AfricanUnion", "UnityInDiversity"] },
      ],
    },
    {
      id: "LGBTQ",
      label: "LGBTQ+ Awareness Days",
      dates: [
        { date: "03-31", name: "International Transgender Day of Visibility", description: "Celebrates transgender people and raises awareness of discrimination.", hashtags: ["TransDayOfVisibility", "TDOV", "TransRights"] },
        { date: "05-17", name: "IDAHOBIT", description: "International Day Against Homophobia, Biphobia and Transphobia.", hashtags: ["IDAHOBIT", "LGBTQIA", "Equality"] },
        { date: "06-01", name: "Pride Month Starts", description: "Start of global Pride celebrations.", hashtags: ["PrideMonth", "Pride2026", "LoveIsLove"], tone: "casual" },
      ],
    },
    {
      id: "Tech",
      label: "Tech Industry Days",
      dates: [
        { date: "03-14", name: "Pi Day", description: "Celebration of the mathematical constant Ï€.", hashtags: ["PiDay", "STEM", "MathsFun"] },
        { date: "04-25", name: "World DNA Day", description: "Commemorates the discovery of the DNA double helix.", hashtags: ["DNADay", "Genetics", "Biotech"] },
        { date: "07-22", name: "Pi Approximation Day", description: "22/7 approximation of pi.", hashtags: ["PiDay", "Mathematics"] },
        { date: "09-13", name: "Programmers' Day", description: "256th day of the year â€“ a day for coders.", hashtags: ["ProgrammersDay", "CodeNewbie", "DevLife"], tone: "cheeky" },
      ],
    },
    {
      id: "Health",
      label: "Health Awareness Days",
      dates: [
        { date: "04-07", name: "World Health Day", description: "Global health awareness.", hashtags: ["WorldHealthDay", "GlobalHealth"] },
        { date: "05-12", name: "International Nurses Day", description: "Honours the contributions of nurses.", hashtags: ["InternationalNursesDay", "Nurses", "HealthcareHeroes"], tone: "professional" },
        { date: "05-31", name: "World No Tobacco Day", description: "Encourages tobacco cessation.", hashtags: ["NoTobaccoDay", "QuitSmoking", "TobaccoFree"] },
        { date: "06-14", name: "World Blood Donor Day", description: "Thanks blood donors and raises awareness.", hashtags: ["WorldBloodDonorDay", "DonateBlood", "SaveLives"] },
      ],
    },
  ];
  
  /**
   * Get all special dates from the selected sets that fall within the next X days.
   * Returns them sorted by date ascending, each with the set it came from.
   */
  export function getUpcomingSpecialDates(
    selectedSets: string[],
    daysAhead: number = 14
  ): Array<{ entry: SpecialDateEntry; date: Date; setId: string }> {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setDate(end.getDate() + daysAhead);
  
    const result: Array<{ entry: SpecialDateEntry; date: Date; setId: string }> = [];
  
    for (const set of HOLIDAY_SETS) {
      if (!selectedSets.includes(set.id)) continue;
  
      for (const entry of set.dates) {
        const date = new Date(now.getFullYear(), parseInt(entry.date.split("-")[0]) - 1, parseInt(entry.date.split("-")[1]));
        // If the date has already passed this year, check next year
        if (date < now) {
          date.setFullYear(date.getFullYear() + 1);
        }
        if (date >= now && date <= end) {
          result.push({ entry, date, setId: set.id });
        }
      }
    }
  
    return result.sort((a, b) => a.date.getTime() - b.date.getTime());
  }