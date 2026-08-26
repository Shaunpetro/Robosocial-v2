// apps/web/src/app/api/cron/media-health/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateMediaHealthReport } from "@/lib/ai/media-analysis";
import { sendMediaHealthReportEmail } from "@/lib/email";

const CRON_SECRET = process.env.CRON_SECRET ?? "";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const companies = await prisma.company.findMany({
      select: {
        id: true,
        name: true,
        industry: true,
        owner: { select: { email: true } },
      },
    });

    const results = [];

    for (const company of companies) {
      const [totalMedia, unusedMedia, expiringSoon] = await Promise.all([
        prisma.media.count({ where: { companyId: company.id } }),
        prisma.media.count({ where: { companyId: company.id, isUsed: false } }),
        prisma.media.count({
          where: {
            companyId: company.id,
            expiresAt: { lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
          },
        }),
      ]);

      // Get recent tags for context (last 10 media)
      const recentMedia = await prisma.media.findMany({
        where: { companyId: company.id },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { tags: true },
      });
      const recentTags = Array.from(new Set(recentMedia.flatMap(m => m.tags || [])));

      if (totalMedia === 0) continue; // nothing to analyse

      try {
        const { recommendations, suggestedTypes } = await generateMediaHealthReport(
          company.name,
          company.industry ?? undefined,
          totalMedia,
          unusedMedia,
          expiringSoon,
          recentTags
        );

        if (company.owner?.email) {
          await sendMediaHealthReportEmail(company.owner.email, company.name, {
            totalMedia,
            unusedMedia,
            expiringSoon,
            recommendations,
            suggestedTypes,
          });
        }

        results.push({
          companyId: company.id,
          name: company.name,
          totalMedia,
          recommendations,
          suggestedTypes,
        });
      } catch (err) {
        console.error(`Health report failed for ${company.name}:`, err);
      }
    }

    return NextResponse.json({ success: true, companiesProcessed: results.length, results });
  } catch (error) {
    console.error("[MediaHealth] Error:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}