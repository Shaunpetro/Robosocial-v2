// apps/web/src/app/api/cron/special-dates/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUpcomingSpecialDates } from "@/lib/special-dates";
import { generateSpecialDatePost } from "@/lib/ai/openai";

const CRON_SECRET = process.env.CRON_SECRET ?? "";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Fetch all companies where special dates feature is enabled
    const configs = await prisma.companySpecialDatesConfig.findMany({
      where: { enabled: true },
      include: {
        company: {
          include: {
            platforms: { where: { isConnected: true } },
            intelligence: { select: { timezone: true, autoApprove: true } },
          },
        },
      },
    });

    console.log(`[SpecialDatesCron] Processing ${configs.length} companies`);

    const results: Array<{
      companyId: string;
      companyName: string;
      generated: number;
      errors: string[];
    }> = [];

    for (const config of configs) {
      const { company } = config;
      if (!company || company.platforms.length === 0) continue;

      const result = { companyId: company.id, companyName: company.name, generated: 0, errors: [] as string[] };

      try {
        // Get upcoming dates for the selected sets (next 14 days)
        const upcoming = getUpcomingSpecialDates(config.holidaySets, 14);

        for (const { entry, date, setId } of upcoming) {
          // Build a unique identifier for deduplication
          const promptId = `special-date:${setId}:${entry.name}`;

          // Check if a post for this company + special date already exists
          const existing = await prisma.generatedPost.findFirst({
            where: {
              companyId: company.id,
              prompt: promptId,
              status: { not: "FAILED" },
            },
          });

          if (existing) {
            console.log(`[SpecialDatesCron] Skipping duplicate: ${entry.name} for ${company.name}`);
            continue;
          }

          // Pick a platform (rotate through connected platforms)
          const platform = company.platforms[result.generated % company.platforms.length];

          // Generate the post
          const generated = await generateSpecialDatePost({
            companyId: company.id,
            companyName: company.name,
            companyIndustry: company.industry ?? undefined,
            platform: platform.type.toLowerCase() as any,
            platformId: platform.id,
            dateName: entry.name,
            dateDescription: entry.description,
            hashtags: entry.hashtags,
            tone: entry.tone || "professional",
          });

          // Schedule for the special date at 08:00 in the company's timezone
          const scheduledAt = new Date(date);
          scheduledAt.setHours(8, 0, 0, 0); // 8 AM local time

          const post = await prisma.generatedPost.create({
            data: {
              companyId: company.id,
              platformId: platform.id,
              content: generated.content,
              hashtags: generated.hashtags,
              prompt: promptId,
              topic: entry.name,
              tone: entry.tone || "professional",
              scheduledFor: scheduledAt,
              status: company.intelligence?.autoApprove ? "SCHEDULED" : "DRAFT",
              generatedBy: "special-dates-ai",
            },
          });

          console.log(`[SpecialDatesCron] Created post for ${entry.name} (${company.name})`);
          result.generated++;
        }
      } catch (companyError) {
        result.errors.push(String(companyError));
      }

      results.push(result);
    }

    const totalGenerated = results.reduce((sum, r) => sum + r.generated, 0);
    return NextResponse.json({
      success: true,
      companies: results,
      totalGenerated,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[SpecialDatesCron] Fatal error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}