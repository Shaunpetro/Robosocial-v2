// apps/web/src/lib/ai/self-optimizer.ts
import { prisma } from "@/lib/db";

interface PostWithEngagement {
  content: string;
  tone: string | null;
  contentType: string | null;
  hook: string | null;
  engagementRate: number;
  length: number;
  publishedAt: Date | null;
}

/**
 * Weekly selfâ€‘optimization: analyses the last 7 days of published posts,
 * extracts winning patterns, and updates CompanyIntelligence.
 * Only runs if there are at least 5 posts with real impressions.
 */
export async function runWeeklySelfOptimization(companyId: string): Promise<void> {
  try {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const posts = await prisma.generatedPost.findMany({
      where: {
        companyId,
        publishedAt: { gte: weekAgo },
        impressions: { gt: 10 },
      },
      select: {
        content: true,
        tone: true,
        contentType: true,
        hook: true,
        likes: true,
        comments: true,
        shares: true,
        impressions: true,
        publishedAt: true,
      },
    });

    if (posts.length < 5) {
      console.log(`[SelfOptimizer] Not enough posts (${posts.length}) for company ${companyId}`);
      return;
    }

    // Calculate engagement rate per post
    const withEngagement: PostWithEngagement[] = posts.map((p) => ({
      ...p,
      engagementRate:
        p.impressions > 0
          ? ((p.likes + p.comments + p.shares) / p.impressions) * 100
          : 0,
      length: p.content.length,
    }));

    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

    // Group by tone
    const toneGroups: Record<string, number[]> = {};
    // Group by content type
    const typeGroups: Record<string, number[]> = {};
    // Group by length range
    const shortPosts = withEngagement.filter((p) => p.length < 200);
    const mediumPosts = withEngagement.filter((p) => p.length >= 200 && p.length <= 500);
    // Group by hook style
    const hookGroups: Record<string, number[]> = {
      question: [],
      slang: [],
      statistic: [],
      other: [],
    };
    // Group by day of week
    const dayGroups: Record<string, number[]> = {};

    withEngagement.forEach((p) => {
      // Tone
      const tone = p.tone || "professional";
      if (!toneGroups[tone]) toneGroups[tone] = [];
      toneGroups[tone].push(p.engagementRate);

      // Content type
      const type = p.contentType || "educational";
      if (!typeGroups[type]) typeGroups[type] = [];
      typeGroups[type].push(p.engagementRate);

      // Hook style
      const hook = (p.hook || "").toLowerCase();
      if (hook.includes("?")) hookGroups.question.push(p.engagementRate);
      else if (hook.match(/eish|sho|yoh|sharp|now now/)) hookGroups.slang.push(p.engagementRate);
      else if (hook.match(/\d+%|\d+ out of/)) hookGroups.statistic.push(p.engagementRate);
      else hookGroups.other.push(p.engagementRate);

      // Day of week
      if (p.publishedAt) {
        const day = [
          "sunday", "monday", "tuesday", "wednesday",
          "thursday", "friday", "saturday",
        ][p.publishedAt.getDay()];
        if (!dayGroups[day]) dayGroups[day] = [];
        dayGroups[day].push(p.engagementRate);
      }
    });

    // Pick winners
    const bestTone =
      Object.entries(toneGroups).sort((a, b) => avg(b[1]) - avg(a[1]))[0]?.[0] || "professional";
    const bestContentType =
      Object.entries(typeGroups).sort((a, b) => avg(b[1]) - avg(a[1]))[0]?.[0] || "educational";
    const bestLengthRange =
      shortPosts.length && mediumPosts.length
        ? avg(shortPosts.map(p => p.engagementRate)) > avg(mediumPosts.map(p => p.engagementRate))
          ? "short"
          : "medium"
        : shortPosts.length
        ? "short"
        : "medium";

    const bestHookStyle =
      Object.entries(hookGroups)
        .filter(([_, arr]) => arr.length > 0)
        .sort((a, b) => avg(b[1]) - avg(a[1]))[0]?.[0] || "other";

    const bestDay =
      Object.entries(dayGroups).sort((a, b) => avg(b[1]) - avg(a[1]))[0]?.[0] || "monday";

    // Update CompanyIntelligence
    await prisma.companyIntelligence.update({
      where: { companyId },
      data: {
        defaultTone: bestTone,
        learnedBestPillars: {
          contentType: bestContentType,
          lengthRange: bestLengthRange,
          hookStyle: bestHookStyle,
        },
        learnedBestDays: [bestDay],
        lastIntelligenceUpdate: new Date(),
      },
    });

    console.log(`[SelfOptimizer] Updated ${companyId}: tone=${bestTone}, type=${bestContentType}, length=${bestLengthRange}, hook=${bestHookStyle}, day=${bestDay}`);
  } catch (error) {
    console.error(`[SelfOptimizer] Failed for company ${companyId}:`, error);
  }
}