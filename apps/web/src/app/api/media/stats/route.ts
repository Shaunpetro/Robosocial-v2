// apps/web/src/app/api/media/stats/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

// GET /api/media/stats - Get media usage statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");

    const now = new Date();
    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() + 7);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const baseWhere: Prisma.MediaWhereInput = {};
    if (companyId) baseWhere.companyId = companyId;

    const availableWhere: Prisma.MediaWhereInput = {
      ...baseWhere,
      isUsed: false,
      OR: [
        { expiresAt: { equals: null } },
        { expiresAt: { gt: now } },
      ] as Prisma.MediaWhereInput[],
    };

    const [
      totalCount,
      availableCount,
      usedCount,
      expiringCount,
      expiredCount,
      imageCount,
      videoCount,
      gifCount,
      uploadedLast7Days,
      uploadedLast30Days,
      usedLast7Days,
      usedLast30Days,
      mediaByPillar,
      mediaByContentType,
      topTags,
      companySummaries,
    ] = await Promise.all([
      prisma.media.count({ where: baseWhere }),
      prisma.media.count({ where: availableWhere }),
      prisma.media.count({ where: { ...baseWhere, isUsed: true } }),
      prisma.media.count({
        where: {
          ...baseWhere,
          isUsed: false,
          expiresAt: { gt: now, lte: warningDate },
        },
      }),
      prisma.media.count({
        where: {
          ...baseWhere,
          expiresAt: { lt: now },
        },
      }),
      prisma.media.count({ where: { ...baseWhere, type: "IMAGE" } }),
      prisma.media.count({ where: { ...baseWhere, type: "VIDEO" } }),
      prisma.media.count({ where: { ...baseWhere, type: "GIF" } }),
      prisma.media.count({
        where: { ...baseWhere, createdAt: { gte: sevenDaysAgo } },
      }),
      prisma.media.count({
        where: { ...baseWhere, createdAt: { gte: thirtyDaysAgo } },
      }),
      prisma.media.count({
        where: { ...baseWhere, usedAt: { gte: sevenDaysAgo } },
      }),
      prisma.media.count({
        where: { ...baseWhere, usedAt: { gte: thirtyDaysAgo } },
      }),
      prisma.media.findMany({
        where: baseWhere,
        select: { pillarIds: true, isUsed: true },
      }),
      prisma.media.findMany({
        where: baseWhere,
        select: { contentTypes: true, isUsed: true },
      }),
      prisma.media.findMany({
        where: baseWhere,
        select: { tags: true },
      }),
      companyId
        ? null
        : prisma.company.findMany({
            select: {
              id: true,
              name: true,
              logoUrl: true,
              _count: { select: { media: true } },
            },
          }),
    ]);

    // Process pillar stats
    const pillarStats: Record<string, { total: number; available: number; used: number }> = {};
    for (const media of mediaByPillar) {
      for (const pillarId of media.pillarIds) {
        if (!pillarStats[pillarId]) pillarStats[pillarId] = { total: 0, available: 0, used: 0 };
        pillarStats[pillarId].total++;
        if (media.isUsed) pillarStats[pillarId].used++;
        else pillarStats[pillarId].available++;
      }
    }

    // Process content type stats
    const contentTypeStats: Record<string, { total: number; available: number; used: number }> = {};
    for (const media of mediaByContentType) {
      for (const ct of media.contentTypes) {
        if (!contentTypeStats[ct]) contentTypeStats[ct] = { total: 0, available: 0, used: 0 };
        contentTypeStats[ct].total++;
        if (media.isUsed) contentTypeStats[ct].used++;
        else contentTypeStats[ct].available++;
      }
    }

    // Process top tags
    const tagCounts: Record<string, number> = {};
    for (const media of topTags) {
      for (const tag of media.tags) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    }
    const sortedTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([tag, count]) => ({ tag, count }));

    // Get pillar names if companyId provided
    let pillarNames: Record<string, string> = {};
    if (companyId) {
      const pillars = await prisma.contentPillar.findMany({
        where: { intelligence: { companyId } },
        select: { id: true, name: true },
      });
      pillarNames = Object.fromEntries(pillars.map((p) => [p.id, p.name]));
    }

    const enrichedPillarStats = Object.entries(pillarStats).map(([id, stats]) => ({
      pillarId: id,
      pillarName: pillarNames[id] || "Unknown",
      ...stats,
    }));

    const usageRate = totalCount > 0 ? Math.round((usedCount / totalCount) * 100) : 0;

    // Calculate average days to use
    const usedMedia = await prisma.media.findMany({
      where: { ...baseWhere, isUsed: true, usedAt: { not: undefined } },
      select: { createdAt: true, usedAt: true },
    });

    let avgDaysToUse: number | null = null;
    if (usedMedia.length > 0) {
      const totalDays = usedMedia.reduce((sum, m) => {
        if (m.usedAt) {
          return sum + (m.usedAt.getTime() - m.createdAt.getTime()) / (1000 * 60 * 60 * 24);
        }
        return sum;
      }, 0);
      avgDaysToUse = Math.round(totalDays / usedMedia.length);
    }

    // Process company summaries (include expiring count)
    let companyBreakdown = null;
    if (companySummaries) {
      // For each company, get expiring count
      const expiringCounts = await prisma.media.groupBy({
        by: ["companyId"],
        where: {
          isUsed: false,
          expiresAt: { gt: now, lte: warningDate },
        },
        _count: { _all: true },
      });
      const expiringMap = new Map(expiringCounts.map((e) => [e.companyId, e._count._all]));

      companyBreakdown = companySummaries
        .filter((c) => c._count.media > 0)
        .map((c) => ({
          id: c.id,
          name: c.name,
          logoUrl: c.logoUrl,
          mediaCount: c._count.media,
          expiring: expiringMap.get(c.id) || 0,
        }))
        .sort((a, b) => b.mediaCount - a.mediaCount);
    }

    return NextResponse.json({
      timestamp: now.toISOString(),
      companyId: companyId || "all",
      overview: {
        total: totalCount,
        available: availableCount,
        used: usedCount,
        expiring: expiringCount,
        expired: expiredCount,
        usageRate: `${usageRate}%`,
        avgDaysToUse,
      },
      byType: {
        image: imageCount,
        video: videoCount,
        gif: gifCount,
      },
      trends: {
        uploadedLast7Days,
        uploadedLast30Days,
        usedLast7Days,
        usedLast30Days,
        uploadRate7d: `${Math.round(uploadedLast7Days / 7 * 10) / 10}/day`,
        usageRate7d: `${Math.round(usedLast7Days / 7 * 10) / 10}/day`,
      },
      byPillar: enrichedPillarStats,
      byContentType: Object.entries(contentTypeStats).map(([type, stats]) => ({
        contentType: type,
        ...stats,
      })),
      topTags: sortedTags,
      ...(companyBreakdown && { companyBreakdown }),
    });
  } catch (error) {
    console.error("Failed to get media stats:", error);
    return NextResponse.json(
      { error: "Failed to get media stats", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}