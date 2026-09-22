// apps/web/src/lib/special-dates/scheduler.ts
// Term scheduler + manual scheduler. Both share the same underlying core:
// generate one holiday's media, then create a GeneratedPost per compatible
// platform. Term scheduling additionally marks `lastScheduledTermId`.
//
// Deduplication is semantic: (company, platform, holiday name, day).
// This is robust to prompt-string format changes and prevents manual and
// term scheduling from creating duplicate posts for the same holiday.

import { prisma } from "@/lib/db";
import { generateSpecialDatePost } from "@/lib/ai/openai";
import {
  getTermById,
  getTermProgress,
  getCurrentWindow,
  getHolidaysInWindow,
  type SaTerm,
} from "./terms";
import {
  generateSpecialDateMedia,
  GenerateSpecialDateMediaError,
} from "./generate";

/**
 * Platforms whose feed format is compatible with our 1200x630 landscape
 * output. Instagram needs square/portrait, WordPress is a blog platform.
 * Multi-AR rendering is a future ship.
 */
export const COMPATIBLE_PLATFORMS: Record<string, { label: string; captionMax: number }> = {
  LINKEDIN: { label: "LinkedIn", captionMax: 210 },
  FACEBOOK: { label: "Facebook", captionMax: 200 },
  TWITTER: { label: "X", captionMax: 240 },
};

// ---------- Types ----------

export interface SchedulableHoliday {
  name: string;
  isoDate: string;
  displayDate: string;
  description: string;
  tone: string;
  setId: string;
  categories: string[];
  alreadyScheduledPlatforms: string[];
}

export interface SchedulableHolidaysResponse {
  window: {
    startIso: string;
    endIso: string;
    daysRemaining: number;
    isShortWindow: boolean;
    termLabel: string | null;
    isBetweenTerms: boolean;
  };
  holidays: SchedulableHoliday[];
  compatiblePlatforms: Array<{
    id: string;
    type: string;
    label: string;
    name: string;
  }>;
}

export interface ScheduleHolidayResult {
  holidayName: string;
  isoDate: string;
  mediaId: string | null;
  postsCreated: Array<{
    platformId: string;
    platformLabel: string;
    postId: string;
    status: string;
    skipped?: boolean;
    skipReason?: string;
  }>;
  errors: string[];
}

export interface ScheduleHolidayInput {
  companyId: string;
  holidayName: string;
  holidayIsoDate: string;
  holidayDescription: string;
  holidayTone: string;
  setId: string;
}

// ---------- Helpers ----------

function dayBounds(isoDate: string): { start: Date; end: Date } {
  const start = new Date(`${isoDate}T00:00:00.000Z`);
  const end = new Date(`${isoDate}T23:59:59.999Z`);
  return { start, end };
}

// ---------- Schedulable holidays (used by both term preview and manual card) ----------

/**
 * Returns every holiday in the CURRENT schedulable window that isn't
 * already scheduled for this company. Uses all enabled holiday sets —
 * public holidays, awareness days, cultural sets, everything the user
 * turned on in Step 1.
 */
export async function getSchedulableHolidays(
  companyId: string
): Promise<SchedulableHolidaysResponse> {
  const config = await prisma.companySpecialDatesConfig.findUnique({
    where: { companyId },
  });

  if (!config) throw new Error("Special dates not configured for this company");

  const window = getCurrentWindow();
  if (!window) {
    throw new Error("No active or upcoming term window found.");
  }

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: { platforms: { where: { isConnected: true } } },
  });
  if (!company) throw new Error("Company not found");

  const compatiblePlatforms = company.platforms
    .filter((p) => COMPATIBLE_PLATFORMS[p.type])
    .map((p) => ({
      id: p.id,
      type: p.type,
      label: COMPATIBLE_PLATFORMS[p.type].label,
      name: p.name || p.username || p.type,
    }));

  const raw = getHolidaysInWindow(
    { start: window.start, end: window.end },
    config.holidaySets || [],
    config.excludedHolidays || []
  );

  const holidays: SchedulableHoliday[] = [];

  for (const { entry, date, setId } of raw) {
    const isoDate = date.toISOString().slice(0, 10);
    const { start, end } = dayBounds(isoDate);

    const existing = await prisma.generatedPost.findMany({
      where: {
        companyId,
        topic: entry.name,
        scheduledFor: { gte: start, lte: end },
        status: { not: "FAILED" },
      },
      include: { platform: true },
    });

    const alreadyScheduledPlatforms = existing.map(
      (p) => COMPATIBLE_PLATFORMS[p.platform.type]?.label || p.platform.type
    );

    holidays.push({
      name: entry.name,
      isoDate,
      displayDate: date.toLocaleDateString("en-ZA", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      description: entry.description,
      tone: entry.tone || "warm",
      setId,
      categories: entry.categories,
      alreadyScheduledPlatforms,
    });
  }

  return {
    window: {
      startIso: window.start.toISOString().slice(0, 10),
      endIso: window.end.toISOString().slice(0, 10),
      daysRemaining: window.daysRemaining,
      isShortWindow: window.isShortWindow,
      termLabel: window.term?.label || null,
      isBetweenTerms: window.isBetweenTerms,
    },
    holidays,
    compatiblePlatforms,
  };
}

// ---------- Term plan (existing — unchanged shape) ----------

export interface TermPlanHoliday {
  name: string;
  isoDate: string;
  displayDate: string;
  description: string;
  tone: string;
  setId: string;
  categories: string[];
}

export interface TermPlanPlatform {
  id: string;
  type: string;
  label: string;
  name: string;
  compatible: boolean;
  skipReason?: string;
}

export interface TermPlan {
  term: {
    id: string;
    label: string;
    startIso: string;
    endIso: string;
    effectiveStartIso: string;
    effectiveEndIso: string;
    daysRemaining: number;
    isMidTerm: boolean;
  };
  holidays: TermPlanHoliday[];
  platforms: TermPlanPlatform[];
  totalPosts: number;
  canCommit: boolean;
  blockReason?: string;
  alreadyScheduled: boolean;
  lastScheduledTermId: string | null;
}

export async function buildTermPlan(
  companyId: string,
  termId?: string
): Promise<TermPlan> {
  const config = await prisma.companySpecialDatesConfig.findUnique({
    where: { companyId },
  });

  if (!config) throw new Error("Special dates not configured for this company");

  const term = termId ? getTermById(termId) : null;
  const resolvedTerm = term || (await import("./terms")).getCurrentTerm();

  if (!resolvedTerm) {
    throw new Error("No current or upcoming term found. Update term definitions.");
  }

  const progress = getTermProgress(resolvedTerm);

  const holidays = getHolidaysInWindow(
    { start: resolvedTerm.start, end: resolvedTerm.end },
    config.holidaySets || [],
    config.excludedHolidays || []
  );

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: { platforms: { where: { isConnected: true } } },
  });
  if (!company) throw new Error("Company not found");

  const platforms: TermPlanPlatform[] = company.platforms.map((p) => {
    const compat = COMPATIBLE_PLATFORMS[p.type];
    return {
      id: p.id,
      type: p.type,
      label: compat?.label || p.type,
      name: p.name || p.username || p.type,
      compatible: !!compat,
      skipReason: compat
        ? undefined
        : `${p.type} feed format needs portrait/square rendering (future ship).`,
    };
  });

  const compatiblePlatforms = platforms.filter((p) => p.compatible);

  const holidayList: TermPlanHoliday[] = holidays.map(({ entry, date, setId }) => ({
    name: entry.name,
    isoDate: date.toISOString().slice(0, 10),
    displayDate: date.toLocaleDateString("en-ZA", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    description: entry.description,
    tone: entry.tone || "professional",
    setId,
    categories: entry.categories,
  }));

  const totalPosts = holidayList.length * compatiblePlatforms.length;

  let blockReason: string | undefined = progress.blockReason;
  if (!blockReason && holidayList.length === 0) {
    blockReason = "No holidays found in this term. Enable more calendars or check excluded dates.";
  }
  if (!blockReason && compatiblePlatforms.length === 0) {
    blockReason = "No compatible platforms connected. Connect LinkedIn, Facebook, or X.";
  }
  if (!blockReason && !config.logoMediaId) {
    blockReason = "Upload a company logo first.";
  }

  const alreadyScheduled = config.lastScheduledTermId === resolvedTerm.id;

  return {
    term: {
      id: resolvedTerm.id,
      label: resolvedTerm.label,
      startIso: resolvedTerm.start.toISOString().slice(0, 10),
      endIso: resolvedTerm.end.toISOString().slice(0, 10),
      effectiveStartIso: progress.effectiveStart.toISOString().slice(0, 10),
      effectiveEndIso: progress.effectiveEnd.toISOString().slice(0, 10),
      daysRemaining: progress.daysRemaining,
      isMidTerm: progress.isMidTerm,
    },
    holidays: holidayList,
    platforms,
    totalPosts,
    canCommit: !blockReason,
    blockReason,
    alreadyScheduled,
    lastScheduledTermId: config.lastScheduledTermId,
  };
}

// ---------- Core scheduling ----------

/**
 * Schedules one holiday for all compatible platforms. Same logic whether
 * called from the term scheduler or the manual scheduler — the only
 * difference is bookkeeping (term scheduler touches lastScheduledTermId,
 * manual scheduler does not).
 */
export async function scheduleHoliday(
  input: ScheduleHolidayInput
): Promise<ScheduleHolidayResult> {
  const {
    companyId,
    holidayName,
    holidayIsoDate,
    holidayDescription,
    holidayTone,
    setId,
  } = input;

  const result: ScheduleHolidayResult = {
    holidayName,
    isoDate: holidayIsoDate,
    mediaId: null,
    postsCreated: [],
    errors: [],
  };

  const config = await prisma.companySpecialDatesConfig.findUnique({
    where: { companyId },
  });
  if (!config) {
    result.errors.push("Special dates not configured for this company");
    return result;
  }

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: {
      platforms: { where: { isConnected: true } },
      intelligence: { select: { autoApprove: true, timezone: true } },
    },
  });
  if (!company) {
    result.errors.push("Company not found");
    return result;
  }

  const compatiblePlatforms = company.platforms.filter(
    (p) => COMPATIBLE_PLATFORMS[p.type]
  );

  if (compatiblePlatforms.length === 0) {
    result.errors.push("No compatible platforms connected");
    return result;
  }

  const holidayDate = new Date(`${holidayIsoDate}T00:00:00.000Z`);
  const scheduledAt = new Date(holidayDate);
  scheduledAt.setUTCHours(8, 0, 0, 0);

  const displayDate = holidayDate.toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // 1. Generate media once for this holiday
  try {
    const media = await generateSpecialDateMedia({
      companyId,
      holidayName,
      holidayDate: displayDate,
      holidayMessage: `Happy ${holidayName}!`,
      holidayDescription,
      holidayTone,
    });
    result.mediaId = media.mediaId;
  } catch (err) {
    if (err instanceof GenerateSpecialDateMediaError) {
      result.errors.push(`Media: ${err.message}`);
    } else {
      result.errors.push(`Media: ${String(err)}`);
    }
    return result;
  }

  // 2. Per-platform: dedup, generate caption, create post
  const { start: dayStart, end: dayEnd } = dayBounds(holidayIsoDate);

  for (const platform of compatiblePlatforms) {
    try {
      const existing = await prisma.generatedPost.findFirst({
        where: {
          companyId,
          platformId: platform.id,
          topic: holidayName,
          scheduledFor: { gte: dayStart, lte: dayEnd },
          status: { not: "FAILED" },
        },
      });

      if (existing) {
        result.postsCreated.push({
          platformId: platform.id,
          platformLabel: COMPATIBLE_PLATFORMS[platform.type].label,
          postId: existing.id,
          status: existing.status,
          skipped: true,
          skipReason: "Already scheduled",
        });
        continue;
      }

      const generated = await generateSpecialDatePost({
        companyId,
        companyName: company.name,
        companyIndustry: company.industry ?? undefined,
        platform: platform.type.toLowerCase() as any,
        platformId: platform.id,
        dateName: holidayName,
        dateDescription: holidayDescription,
        hashtags: [
          `#${holidayName.replace(/[^A-Za-z0-9]/g, "")}`,
          "#SpecialDates",
        ],
        tone: holidayTone,
      });

      const captionMax = COMPATIBLE_PLATFORMS[platform.type].captionMax;
      const caption = generated.content.slice(0, captionMax);

      const post = await prisma.generatedPost.create({
        data: {
          companyId,
          platformId: platform.id,
          content: caption,
          hashtags: generated.hashtags,
          prompt: `special-date:${setId}:${holidayName}:${platform.id}`,
          topic: holidayName,
          tone: holidayTone,
          scheduledFor: scheduledAt,
          status: company.intelligence?.autoApprove ? "SCHEDULED" : "DRAFT",
          generatedBy: "special-dates-scheduler",
        },
      });

      if (result.mediaId) {
        await prisma.postMedia.create({
          data: {
            postId: post.id,
            mediaId: result.mediaId,
            order: 0,
          },
        });
      }

      result.postsCreated.push({
        platformId: platform.id,
        platformLabel: COMPATIBLE_PLATFORMS[platform.type].label,
        postId: post.id,
        status: post.status,
      });
    } catch (err) {
      result.errors.push(
        `${COMPATIBLE_PLATFORMS[platform.type].label}: ${String(err)}`
      );
    }
  }

  return result;
}

// ---------- Term commit (wrapper around scheduleHoliday) ----------

export interface CommitHolidayInput extends ScheduleHolidayInput {
  termId: string;
  isFinalHoliday?: boolean;
}

export async function commitHolidayToTerm(
  input: CommitHolidayInput
): Promise<ScheduleHolidayResult> {
  const result = await scheduleHoliday({
    companyId: input.companyId,
    holidayName: input.holidayName,
    holidayIsoDate: input.holidayIsoDate,
    holidayDescription: input.holidayDescription,
    holidayTone: input.holidayTone,
    setId: input.setId,
  });

  // Only mark the term as scheduled after the final holiday commits cleanly.
  if (input.isFinalHoliday && result.errors.length === 0) {
    await prisma.companySpecialDatesConfig.update({
      where: { companyId: input.companyId },
      data: { lastScheduledTermId: input.termId },
    });
  }

  return result;
}