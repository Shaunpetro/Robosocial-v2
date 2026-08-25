// apps/web/src/app/api/intelligence/reconstruct/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { analysePlatformPosts, type PlatformPost } from "@/lib/ai/analyze-posts";

const CRON_SECRET = process.env.CRON_SECRET ?? "";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const companyId = request.nextUrl.searchParams.get("companyId");
  if (!companyId) {
    return NextResponse.json({ error: "companyId is required" }, { status: 400 });
  }

  try {
    const platforms = await prisma.platform.findMany({
      where: { companyId, isConnected: true },
      include: { company: true },
    });

    const allPosts: PlatformPost[] = [];

    for (const platform of platforms) {
      const data = platform.connectionData as Record<string, any> | null;
      if (!data) continue;

      if (platform.type === "FACEBOOK") {
        const pageId = data.pageId;
        const accessToken = data.accessToken || data.userAccessToken;
        if (pageId && accessToken) {
          const posts = await fetchFacebookPosts(pageId, accessToken);
          allPosts.push(...posts);
        }
      } else if (platform.type === "LINKEDIN") {
        const accessToken = data.accessToken;
        if (accessToken) {
          const isOrg = data.postingMode === "organization";
          const author = isOrg ? `urn:li:organization:${data.organizationId}` : `urn:li:person:${data.linkedinSub}`;
          if (author) {
            const posts = await fetchLinkedInPosts(accessToken, author);
            allPosts.push(...posts);
          }
        }
      }
    }

    if (allPosts.length === 0) {
      return NextResponse.json({ success: false, error: "No posts fetched from connected platforms" }, { status: 404 });
    }

    const insights = await analysePlatformPosts(allPosts);

    // Update CompanyIntelligence with learned fields
    const existing = await prisma.companyIntelligence.findUnique({
      where: { companyId },
    });

    const dataToUpdate = {
      learnedBestDays: insights.bestDays,
      learnedBestTimes: insights.bestTimes as any,
      learnedBestPillars: insights.topContentTypes as any,
      topPerformingTopics: insights.bestTopics as any,
      topPerformingTypes: insights.topContentTypes as any,
      avgEngagementRate: insights.avgEngagementRate,
      lastIntelligenceUpdate: new Date(),
    };

    if (existing) {
      await prisma.companyIntelligence.update({
        where: { companyId },
        data: dataToUpdate,
      });
    } else {
      await prisma.companyIntelligence.create({
        data: {
          companyId,
          ...dataToUpdate,
        },
      });
    }

    return NextResponse.json({ success: true, insights, postsAnalysed: allPosts.length });
  } catch (error) {
    console.error("[Intelligence Reconstruct] Error:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

async function fetchFacebookPosts(pageId: string, accessToken: string): Promise<PlatformPost[]> {
  const url = `https://graph.facebook.com/v21.0/${pageId}/posts?fields=id,message,created_time,likes.summary(true),comments.summary(true),shares,insights.metric(post_impressions)&access_token=${accessToken}&limit=30`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  const posts = data.data || [];
  return posts
    .filter((p: any) => p.message)
    .map((p: any) => ({
      id: p.id,
      text: p.message || "",
      createdAt: p.created_time,
      likes: p.likes?.summary?.total_count || 0,
      comments: p.comments?.summary?.total_count || 0,
      shares: p.shares?.count || 0,
      impressions: p.insights?.data?.[0]?.values?.[0]?.value || 0,
    }));
}

async function fetchLinkedInPosts(accessToken: string, author: string): Promise<PlatformPost[]> {
  const encodedAuthor = encodeURIComponent(author);
  const url = `https://api.linkedin.com/v2/posts?q=author&author=${encodedAuthor}&count=30`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}`, "X-Restli-Protocol-Version": "2.0.0" },
  });
  if (!res.ok) return [];
  const data = await res.json();
  const elements = data.elements || [];
  return elements
    .filter((p: any) => p.commentary)
    .map((p: any) => ({
      id: p.id,
      text: p.commentary || "",
      createdAt: p.created?.time || new Date().toISOString(),
      likes: p.socialDetail?.totalSocialActivityCounts?.numLikes || 0,
      comments: p.socialDetail?.totalSocialActivityCounts?.numComments || 0,
      shares: p.socialDetail?.totalSocialActivityCounts?.numShares || 0,
      impressions: p.socialDetail?.totalSocialActivityCounts?.numImpressions || 0,
    }));
}