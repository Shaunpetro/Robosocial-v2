// apps/web/src/lib/special-dates/scheduler.ts
// Term scheduler: builds a preview of what would be scheduled, and commits
// one holiday at a time (to fit Vercel's 10s serverless limit).

import { prisma } from "@/lib/db";
import { generateSpecialDatePost } from "@/lib/ai/openai";
import {
  getTermById,
  getTermProgress,
  getHolidaysInTerm,
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
const COMPATIBLE_PLATFORMS: Record<string, { label: string; captionMax: number }> = {
  LINKEDIN: { label: "LinkedIn", captionMax: 210 },
  FACEBOOK: { label: "Facebook", captionMax: 200 },
  TWITTER: { label: "X", captionMax: 240 },
};

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

  if (!config) {
    throw new Error("Special dates not configured for this company");
  }

  const term = termId ? getTermById(termId) : null;
  const resolvedTerm = term || (await import("./terms")).getCurrentTerm();

  if (!resolvedTerm) {
    throw new Error("No current or upcoming term found. Update term definitions.");
  }

  const progress = getTermProgress(resolvedTerm);

  const holidays = getHolidaysInTerm(
    resolvedTerm,
    config.holidaySets || [],
    config.excludedHolidays || []
  );

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: {
      platforms: { where: { isConnected: true } },
    },
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

export interface CommitHolidayResult {
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

export interface CommitHolidayInput {
  companyId: string;
  termId: string;
  holidayName: string;
  holidayIsoDate: string;
  holidayDescription: string;
  holidayTone: string;
  setId: string;
  isFinalHoliday?: boolean;
}

/**
 * Commits one holiday: generates media once, then creates a GeneratedPost
 * per compatible platform. Called once per holiday by the client, so each
 * request stays inside Vercel's 10s limit.
 */
export async function commitHolidayToTerm(
  input: CommitHolidayInput
): Promise<CommitHolidayResult> {
  const {
    companyId,
    termId,
    holidayName,
    holidayIsoDate,
    holidayDescription,
    holidayTone,
    setId,
    isFinalHoliday,
  } = input;

  const result: CommitHolidayResult = {
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

  // Compute scheduled time: 08:00 in company timezone, on the holiday date.
  const holidayDate = new Date(`${holidayIsoDate}T00:00:00.000Z`);
  const scheduledAt = new Date(holidayDate);
  scheduledAt.setUTCHours(8, 0, 0, 0);

  const displayDate = holidayDate.toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // 1. Generate media once for this holiday (reused across platforms)
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
    // Media failure is fatal for this holiday — no posts without an image.
    return result;
  }

  // 2. For each compatible platform: dedupe check, generate caption, create post
  for (const platform of compatiblePlatforms) {
    const promptId = `special-date:${termId}:${setId}:${holidayName}:${platform.id}`;

    try {
      const existing = await prisma.generatedPost.findFirst({
        where: {
          companyId,
          prompt: promptId,
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
          skipReason: "Already scheduled for this term",
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
        hashtags: [`#${holidayName.replace(/[^A-Za-z0-9]/g, "")}`, "#SpecialDates"],
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
          prompt: promptId,
          topic: holidayName,
          tone: holidayTone,
          scheduledFor: scheduledAt,
          status: company.intelligence?.autoApprove ? "SCHEDULED" : "DRAFT",
          generatedBy: "special-dates-term-scheduler",
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

  // 3. Only mark the term as scheduled after the final holiday is committed.
  if (isFinalHoliday && result.errors.length === 0) {
    await prisma.companySpecialDatesConfig.update({
      where: { companyId },
      data: { lastScheduledTermId: termId },
    });
  }

  return result;
}