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
    const configs = await prisma.companySpecialDatesConfig.findMany({
      where: { enabled: true },
      include: {
        company: {
          include: {
            platforms: { where: { isConnected: true } },
            intelligence: { select: { timezone: true, autoApprove: true } },
          },
        },
        generatedMedia: true,
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
      const { company, generatedMedia } = config;
      if (!company || company.platforms.length === 0) continue;

      const result = {
        companyId: company.id,
        companyName: company.name,
        generated: 0,
        errors: [] as string[],
      };

      // --- NEW: enforce complete setup ---
      if (!config.logoMediaId) {
        result.errors.push("No company logo uploaded – skipping.");
        results.push(result);
        continue;
      }
      if (!config.holidaySets || config.holidaySets.length === 0) {
        result.errors.push("No holiday sets selected – skipping.");
        results.push(result);
        continue;
      }

      try {
        const upcoming = getUpcomingSpecialDates(config.holidaySets, 14);

        for (const { entry, date, setId } of upcoming) {
          const promptId = `special-date:${setId}:${entry.name}`;

          const existing = await prisma.generatedPost.findFirst({
            where: {
              companyId: company.id,
              prompt: promptId,
              status: { not: "FAILED" },
            },
          });

          if (existing) {
            console.log(
              `[SpecialDatesCron] Skipping duplicate: ${entry.name} for ${company.name}`
            );
            continue;
          }

          const platform =
            company.platforms[result.generated % company.platforms.length];

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

          const scheduledAt = new Date(date);
          scheduledAt.setHours(8, 0, 0, 0);

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
              status: company.intelligence?.autoApprove
                ? "SCHEDULED"
                : "DRAFT",
              generatedBy: "special-dates-ai",
            },
          });

          // Attach generated branded image if available
          if (generatedMedia) {
            await prisma.postMedia.create({
              data: {
                postId: post.id,
                mediaId: generatedMedia.id,
                order: 0,
              },
            });
          }

          console.log(
            `[SpecialDatesCron] Created post for ${entry.name} (${company.name})`
          );
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