// apps/web/src/app/api/platforms/verify/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyFacebookToken } from "@/lib/publisher/facebook";
import { verifyLinkedInToken } from "@/lib/publisher/linkedin";
import { PlatformType } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json(
        { error: "companyId query parameter is required" },
        { status: 400 }
      );
    }

    const platforms = await prisma.platform.findMany({
      where: { companyId, isConnected: true },
      select: {
        id: true,
        type: true,
        name: true,
        connectionData: true,
        updatedAt: true,
      },
    });

    if (platforms.length === 0) {
      return NextResponse.json({
        companyId,
        platforms: [],
        message: "No connected platforms found",
      });
    }

    const results = [];

    for (const platform of platforms) {
      const connectionData = (platform.connectionData || {}) as Record<string, unknown>;
      let tokenValid = false;
      let errorMessage: string | null = null;
      let accountName: string | null = null;

      if (platform.type === PlatformType.FACEBOOK) {
        const pageAccessToken = (connectionData.pageAccessToken ||
          connectionData.accessToken) as string | undefined;
        const pageId = connectionData.pageId as string | undefined;

        if (!pageAccessToken || !pageId) {
          errorMessage = "Missing access token or page ID";
        } else {
          const verification = await verifyFacebookToken(pageAccessToken);
          tokenValid = verification.valid;
          if (!verification.valid) {
            errorMessage = verification.error || "Token invalid";
          } else if (verification.pageInfo) {
            accountName = verification.pageInfo.name;
          }
        }
      } else if (platform.type === PlatformType.LINKEDIN) {
        const accessToken = connectionData.accessToken as string | undefined;
        if (!accessToken) {
          errorMessage = "Missing access token";
        } else {
          const verification = await verifyLinkedInToken(accessToken);
          tokenValid = verification.valid;
          if (!verification.valid) {
            errorMessage = verification.error || "Token invalid";
          } else if (verification.profile) {
            accountName = verification.profile.name;
          }
        }
      } else {
        // Other platforms not yet implemented for verification
        errorMessage = "Verification not implemented for this platform type";
      }

      results.push({
        id: platform.id,
        type: platform.type,
        name: platform.name,
        tokenValid,
        accountName,
        error: errorMessage,
        lastUpdated: platform.updatedAt,
      });
    }

    return NextResponse.json({
      companyId,
      platforms: results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to verify platform tokens:", error);
    return NextResponse.json(
      { error: "Failed to verify platform tokens" },
      { status: 500 }
    );
  }
}