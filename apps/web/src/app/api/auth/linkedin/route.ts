// apps/web/src/app/api/auth/linkedin/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getLinkedInAuthUrl } from '@/lib/oauth/linkedin';

export async function GET(request: NextRequest) {
  try {
    const companyId = request.nextUrl.searchParams.get('companyId');
    const postMode = request.nextUrl.searchParams.get('postMode') as 'profile' | 'page' | null;

    if (!companyId) {
      return NextResponse.redirect(
        new URL('/platforms?error=missing_company', request.url)
      );
    }

    if (!process.env.LINKEDIN_CLIENT_ID || !process.env.LINKEDIN_CLIENT_SECRET) {
      return NextResponse.redirect(
        new URL('/platforms?error=linkedin_not_configured', request.url)
      );
    }

    const mode = postMode === 'page' ? 'page' : 'profile';
    const authUrl = getLinkedInAuthUrl(companyId, mode);
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('LinkedIn OAuth init failed:', error);
    return NextResponse.redirect(
      new URL('/platforms?error=linkedin_init_failed', request.url)
    );
  }
}