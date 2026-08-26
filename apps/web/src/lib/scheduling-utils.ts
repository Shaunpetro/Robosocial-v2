// apps/web/src/lib/scheduling-utils.ts

/**
 * Scheduling Utilities
 * Handles time slot mapping, timezone conversion, and date+time combination
 */

export const TIME_SLOT_TO_HOURS: Record<string, string[]> = {
  early_morning: ['06:30', '07:30', '08:30'],
  morning: ['09:00', '10:00', '11:00'],
  lunch: ['12:00', '12:30', '13:00'],
  afternoon: ['14:00', '15:00', '16:00'],
  evening: ['17:00', '18:00', '19:00'],
  night: ['20:00', '21:00', '22:00'],
};

export const DEFAULT_POSTING_TIMES = ['09:00', '14:00', '17:00'];
export const DAY_ORDER = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export function normalizePreferredTimes(
  preferredTimes: unknown,
  preferredDays: string[]
): Record<string, string[]> {
  const normalizedDays = preferredDays.map(d => d.toLowerCase());
  const result: Record<string, string[]> = {};

  for (const day of normalizedDays.length > 0 ? normalizedDays : ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']) {
    result[day] = [];
  }

  if (!preferredTimes) {
    for (const day of Object.keys(result)) {
      result[day] = [...DEFAULT_POSTING_TIMES];
    }
    return result;
  }

  // If array of slot IDs: ["morning","afternoon"]
  if (Array.isArray(preferredTimes)) {
    const times: string[] = [];
    for (const slot of preferredTimes) {
      if (typeof slot === 'string') {
        const slotHours = TIME_SLOT_TO_HOURS[slot.toLowerCase()];
        if (slotHours) {
          // Randomly pick one time from the slot hours
          times.push(slotHours[Math.floor(Math.random() * slotHours.length)]);
        } else if (slot.match(/^\d{1,2}:\d{2}$/)) {
          times.push(slot);
        }
      }
    }
    const finalTimes = times.length > 0 ? times : DEFAULT_POSTING_TIMES;
    for (const day of Object.keys(result)) {
      result[day] = [...finalTimes];
    }
    return result;
  }

  // Object format: { monday: ['09:00'], ... }
  if (typeof preferredTimes === 'object' && preferredTimes !== null) {
    const timesObj = preferredTimes as Record<string, unknown>;
    for (const [day, times] of Object.entries(timesObj)) {
      const dayLower = day.toLowerCase();
      if (Array.isArray(times)) {
        result[dayLower] = times.map(t => String(t));
      }
    }
    for (const day of Object.keys(result)) {
      if (!result[day] || result[day].length === 0) {
        result[day] = [...DEFAULT_POSTING_TIMES];
      }
    }
    return result;
  }

  for (const day of Object.keys(result)) {
    result[day] = [...DEFAULT_POSTING_TIMES];
  }
  return result;
}

export function getTimesForDay(dayOfWeek: string, normalizedTimes: Record<string, string[]>): string[] {
  const day = dayOfWeek.toLowerCase();
  return normalizedTimes[day] || DEFAULT_POSTING_TIMES;
}

export function createScheduledDate(baseDate: Date, time: string, timezone: string = 'UTC'): Date {
  const [hours, minutes] = time.split(':').map(Number);
  const scheduledDate = new Date(baseDate);
  scheduledDate.setHours(0, 0, 0, 0);

  const tzOffsets: Record<string, number> = {
    'Africa/Johannesburg': 2,
    'UTC': 0,
    'America/New_York': -5,
    'America/Los_Angeles': -8,
    'Europe/London': 0,
    'Europe/Paris': 1,
    'Asia/Singapore': 8,
    'Australia/Sydney': 10,
  };
  const offset = tzOffsets[timezone] ?? 0;
  const utcHours = hours - offset;
  scheduledDate.setUTCHours(utcHours, minutes, 0, 0);
  return scheduledDate;
}

export function distributePostsAcrossSchedule(
  postCount: number,
  preferredDays: string[],
  preferredTimeSlots: string[],
  startDate: Date,
  timezone: string
): Array<{ date: Date; time: string; dayOfWeek: string }> {
  const slots: Array<{ date: Date; time: string; dayOfWeek: string }> = [];

  const days = preferredDays.length > 0 ? preferredDays.map(d => d.toLowerCase()) : ['monday', 'wednesday', 'friday'];
  const allTimes = preferredTimeSlots.flatMap(slot => TIME_SLOT_TO_HOURS[slot] || []);

  if (allTimes.length === 0) {
    allTimes.push(...DEFAULT_POSTING_TIMES);
  }

  let currentDate = new Date(startDate);
  currentDate.setHours(0, 0, 0, 0);

  // Generate slots up to 60 days out
  while (slots.length < postCount) {
    const dayOfWeek = DAY_ORDER[currentDate.getDay()];

    if (days.includes(dayOfWeek)) {
      // Random time from selected slots
      const randomTime = allTimes[Math.floor(Math.random() * allTimes.length)];
      const scheduledDate = createScheduledDate(currentDate, randomTime, timezone);
      slots.push({ date: scheduledDate, time: randomTime, dayOfWeek });
    }

    currentDate.setDate(currentDate.getDate() + 1);
    if (currentDate.getTime() - startDate.getTime() > 60 * 24 * 60 * 60 * 1000) {
      break;
    }
  }

  return slots;
}

export function getNextDayOfWeek(startDate: Date, targetDay: string): Date {
  const targetIndex = DAY_ORDER.indexOf(targetDay.toLowerCase());
  if (targetIndex === -1) return new Date(startDate);
  const result = new Date(startDate);
  const currentDay = result.getDay();
  const daysUntilTarget = (targetIndex - currentDay + 7) % 7;
  const daysToAdd = daysUntilTarget === 0 ? 7 : daysUntilTarget;
  result.setDate(result.getDate() + daysToAdd);
  return result;
}