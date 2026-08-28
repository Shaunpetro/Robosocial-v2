// apps/web/src/lib/scheduler/index.ts

import { prisma } from '@/lib/db';
import { createLinkedInPost, verifyLinkedInToken } from '@/lib/publisher/linkedin';
import { createFacebookPost, verifyFacebookToken } from '@/lib/publisher/facebook';
import { PostStatus, PlatformType } from '@prisma/client';

export interface SchedulerResult {
  processed: number;
  published: number;
  failed: number;
  errors: Array<{ postId: string; error: string }>;
  tokenStatus?: Array<{
    platformId: string;
    type: PlatformType;
    valid: boolean;
    error?: string;
  }>;
  debug?: {
    queryTime: string;
    postsFound: number;
    query: object;
  };
}

/**
 * Process all posts that are scheduled and due for publishing
 */
export async function processScheduledPosts(): Promise<SchedulerResult> {
  const result: SchedulerResult = {
    processed: 0,
    published: 0,
    failed: 0,
    errors: [],
    tokenStatus: [],
  };

  const now = new Date();

  console.log(`[Scheduler] Starting scheduled post processing at ${now.toISOString()}`);
  console.log(`[Scheduler] PostStatus.SCHEDULED value: "${PostStatus.SCHEDULED}"`);

  try {
    const whereClause = {
      status: PostStatus.SCHEDULED,
      scheduledFor: {
        lte: now,
      },
    };

    console.log(`[Scheduler] Query where clause:`, JSON.stringify(whereClause, null, 2));

    const countAll = await prisma.generatedPost.count({
      where: { status: PostStatus.SCHEDULED },
    });
    console.log(`[Scheduler] Total SCHEDULED posts (any time): ${countAll}`);

    const countDue = await prisma.generatedPost.count({
      where: whereClause,
    });
    console.log(`[Scheduler] SCHEDULED posts due now: ${countDue}`);

    const duePosts = await prisma.generatedPost.findMany({
      where: whereClause,
      include: {
        platform: true,
        company: true,
        postMedia: {
          include: {
            media: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
      take: 10,
      orderBy: {
        scheduledFor: 'asc',
      },
    });

    console.log(`[Scheduler] Found ${duePosts.length} posts due for publishing`);

    result.debug = {
      queryTime: now.toISOString(),
      postsFound: duePosts.length,
      query: whereClause,
    };

    // Pre-verify platform tokens for all platforms involved in due posts
    const platformIds = [...new Set(duePosts.map((p) => p.platform.id))];
    const tokenMap = new Map<string, { valid: boolean; error?: string }>();

    for (const platformId of platformIds) {
      const platform = duePosts.find((p) => p.platform.id === platformId)?.platform;
      if (!platform) continue;

      const connectionData = (platform.connectionData || {}) as Record<string, unknown>;
      let valid = false;
      let error: string | undefined;

      if (platform.type === PlatformType.FACEBOOK) {
        const pageAccessToken = (connectionData.pageAccessToken ||
          connectionData.accessToken) as string | undefined;
        if (!pageAccessToken) {
          error = 'Missing Facebook access token';
        } else {
          const verification = await verifyFacebookToken(pageAccessToken);
          valid = verification.valid;
          if (!valid) error = verification.error || 'Facebook token invalid';
        }
      } else if (platform.type === PlatformType.LINKEDIN) {
        const accessToken = connectionData.accessToken as string | undefined;
        if (!accessToken) {
          error = 'Missing LinkedIn access token';
        } else {
          const verification = await verifyLinkedInToken(accessToken);
          valid = verification.valid;
          if (!valid) error = verification.error || 'LinkedIn token invalid';
        }
      } else {
        error = 'Token verification not implemented';
      }

      tokenMap.set(platformId, { valid, error });
      result.tokenStatus?.push({
        platformId,
        type: platform.type,
        valid,
        error,
      });
    }

    for (const post of duePosts) {
      result.processed++;

      try {
        // Token check
        const tokenCheck = tokenMap.get(post.platform.id);
        if (tokenCheck && !tokenCheck.valid) {
          throw new Error(
            `Platform token invalid for ${post.platform.type}: ${tokenCheck.error || 'unknown'}`
          );
        }

        // Mark as PUBLISHING to prevent duplicate processing
        await prisma.generatedPost.update({
          where: { id: post.id },
          data: { status: PostStatus.PUBLISHING },
        });

        console.log(`[Scheduler] Publishing post ${post.id} to ${post.platform.type}`);
        console.log(`[Scheduler] Post has ${post.postMedia?.length || 0} media attachments`);

        const mediaUrls = post.postMedia?.map((pm) => pm.media.url) || [];

        if (!post.platform.isConnected || !post.platform.connectionData) {
          throw new Error(`Platform ${post.platform.type} is not connected`);
        }

        const connectionData = post.platform.connectionData as Record<string, unknown>;

        let publishResult: { success: boolean; postId?: string; postUrl?: string; error?: string };

        switch (post.platform.type) {
          case PlatformType.LINKEDIN:
            {
              const linkedinSub = connectionData.linkedinSub as string | undefined;
              const linkedinAccessToken = connectionData.accessToken as string | undefined;
              if (!linkedinSub || !linkedinAccessToken) {
                throw new Error('LinkedIn connection data missing. Please reconnect.');
              }
              publishResult = await createLinkedInPost({
                content: post.content,
                mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
                accessToken: linkedinAccessToken,
                authorId: linkedinSub,
                postingMode: (connectionData.postingMode as 'personal' | 'organization') || 'personal',
                organizationId: connectionData.organizationId as string | null | undefined,
              });
            }
            break;

          case PlatformType.FACEBOOK:
            {
              const pageAccessToken = (connectionData.pageAccessToken ||
                connectionData.accessToken) as string | undefined;
              const pageId = connectionData.pageId as string | undefined;
              if (!pageAccessToken || !pageId) {
                throw new Error('Facebook connection data missing. Please reconnect.');
              }
              publishResult = await createFacebookPost({
                content: post.content,
                mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
                pageAccessToken: pageAccessToken,
                pageId: pageId,
              });
            }
            break;

          default:
            throw new Error(`Unsupported platform: ${post.platform.type}`);
        }

        if (publishResult.success) {
          await prisma.generatedPost.update({
            where: { id: post.id },
            data: {
              status: PostStatus.PUBLISHED,
              publishedAt: new Date(),
              externalPostId: publishResult.postId || null,
              externalPostUrl: publishResult.postUrl || null,
            },
          });

          console.log(`[Scheduler] ✅ Successfully published post ${post.id}`);
          result.published++;
        } else {
          throw new Error(publishResult.error || 'Unknown publishing error');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[Scheduler] ❌ Failed to publish post ${post.id}:`, errorMessage);

        await prisma.generatedPost.update({
          where: { id: post.id },
          data: { status: PostStatus.FAILED },
        });

        result.failed++;
        result.errors.push({
          postId: post.id,
          error: errorMessage,
        });
      }
    }
  } catch (error) {
    console.error('[Scheduler] Fatal error:', error);
    throw error;
  }

  console.log(
    `[Scheduler] Completed: ${result.processed} processed, ${result.published} published, ${result.failed} failed`
  );

  return result;
}

/**
 * Get upcoming scheduled posts for a company
 */
export async function getUpcomingScheduledPosts(companyId: string, limit = 10) {
  return prisma.generatedPost.findMany({
    where: {
      companyId,
      status: PostStatus.SCHEDULED,
      scheduledFor: {
        gte: new Date(),
      },
    },
    include: {
      platform: true,
      postMedia: {
        include: {
          media: true,
        },
      },
    },
    orderBy: {
      scheduledFor: 'asc',
    },
    take: limit,
  });
}

/**
 * Get failed posts for retry
 */
export async function getFailedPosts(companyId: string, limit = 10) {
  return prisma.generatedPost.findMany({
    where: {
      companyId,
      status: PostStatus.FAILED,
    },
    include: {
      platform: true,
      postMedia: {
        include: {
          media: true,
        },
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
    take: limit,
  });
}

/**
 * Retry a failed post
 */
export async function retryFailedPost(postId: string): Promise<boolean> {
  try {
    await prisma.generatedPost.update({
      where: { id: postId },
      data: {
        status: PostStatus.SCHEDULED,
        scheduledFor: new Date(), // Retry immediately
      },
    });
    return true;
  } catch (error) {
    console.error(`[Scheduler] Failed to retry post ${postId}:`, error);
    return false;
  }
}

/**
 * Schedule a post for a specific time
 */
export async function schedulePost(postId: string, scheduledFor: Date): Promise<boolean> {
  try {
    await prisma.generatedPost.update({
      where: { id: postId },
      data: {
        status: PostStatus.SCHEDULED,
        scheduledFor,
      },
    });
    return true;
  } catch (error) {
    console.error(`[Scheduler] Failed to schedule post ${postId}:`, error);
    return false;
  }
}

/**
 * Cancel a scheduled post (revert to draft)
 */
export async function cancelScheduledPost(postId: string): Promise<boolean> {
  try {
    await prisma.generatedPost.update({
      where: { id: postId },
      data: {
        status: PostStatus.DRAFT,
        scheduledFor: null,
      },
    });
    return true;
  } catch (error) {
    console.error(`[Scheduler] Failed to cancel scheduled post ${postId}:`, error);
    return false;
  }
}

/**
 * Get published posts that have external IDs (for analytics sync)
 */
export async function getPublishedPostsWithExternalIds(companyId: string, limit = 50) {
  return prisma.generatedPost.findMany({
    where: {
      companyId,
      status: PostStatus.PUBLISHED,
      externalPostId: {
        not: null,
      },
    },
    include: {
      platform: true,
    },
    orderBy: {
      publishedAt: 'desc',
    },
    take: limit,
  });
}

/**
 * Update analytics for a published post
 */
export async function updatePostAnalytics(
  postId: string,
  analytics: {
    likes?: number;
    comments?: number;
    shares?: number;
    impressions?: number;
  }
): Promise<boolean> {
  try {
    await prisma.generatedPost.update({
      where: { id: postId },
      data: {
        likes: analytics.likes ?? 0,
        comments: analytics.comments ?? 0,
        shares: analytics.shares ?? 0,
        impressions: analytics.impressions ?? 0,
        lastSyncedAt: new Date(),
      },
    });
    return true;
  } catch (error) {
    console.error(`[Scheduler] Failed to update analytics for post ${postId}:`, error);
    return false;
  }
}