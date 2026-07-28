// apps/web/src/app/api/cron/publish/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { processScheduledPosts } from '@/lib/scheduler';

const CRON_SECRET = process.env.CRON_SECRET ?? '';

/**
 * Cron job endpoint for processing scheduled posts.
 * Called by external scheduler (cron-job.org) every minute.
 *
 * Flow:
 * 1. Verify CRON_SECRET authorization header
 * 2. Find all SCHEDULED posts where scheduledFor <= now
 * 3. Mark as PUBLISHING to prevent duplicate processing
 * 4. Publish to LinkedIn/Facebook via platform APIs
 * 5. Update status to PUBLISHED and save externalPostId
 * 6. If error, mark as FAILED
 */
export async function GET(request: NextRequest) {
  // --- SECURITY CHECK ---
  const authHeader = request.headers.get('authorization');
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const startTime = Date.now();

  console.log('[Cron] ========================================');
  console.log('[Cron] Starting scheduled post processing...');
  console.log('[Cron] Time:', new Date().toISOString());

  try {
    const result = await processScheduledPosts();
    const duration = Date.now() - startTime;

    console.log(`[Cron] Completed in ${duration}ms`);
    console.log('[Cron] Result:', JSON.stringify(result));
    console.log('[Cron] ========================================');

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      result,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[Cron] Failed after', duration, 'ms:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Support POST as well (for manual triggers)
export async function POST(request: NextRequest) {
  return GET(request);
}