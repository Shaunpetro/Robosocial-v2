// apps/web/src/lib/app-promotion/facebook.ts
import { prisma } from "@/lib/db";
import { createFacebookPost } from "@/lib/publisher/facebook";

export interface HostPlatform {
  pageId: string;
  pageAccessToken: string;
  pageName: string | null;
}

/**
 * Reads the Facebook Platform row for the designated App Promotion host
 * company. Reuses the existing OAuth connection — no separate credentials.
 */
export async function getHostPlatform(): Promise<HostPlatform> {
  const companyId = process.env.APP_PROMOTION_HOST_COMPANY_ID;
  if (!companyId) {
    throw new Error("APP_PROMOTION_HOST_COMPANY_ID is not set");
  }

  const platform = await prisma.platform.findFirst({
    where: { companyId, type: "FACEBOOK", isConnected: true },
  });

  if (!platform) {
    throw new Error(
      `No connected Facebook platform for host company ${companyId}`
    );
  }

  const data = (platform.connectionData ?? {}) as Record<string, unknown>;

  if (data.pendingPageSelection === true) {
    throw new Error(
      "Host Facebook platform is awaiting page selection. Complete the connection first."
    );
  }

  const pageId = data.pageId as string | undefined;
  const pageAccessToken = data.accessToken as string | undefined;
  const pageName = (data.pageName as string | undefined) ?? null;

  if (!pageId || !pageAccessToken) {
    throw new Error("Host Facebook platform missing pageId or accessToken");
  }

  return { pageId, pageAccessToken, pageName };
}

export interface PublishPayload {
  content: string;
  link?: string;
  mediaUrls?: string[];
}

export async function publishPromoToFacebook(payload: PublishPayload) {
  const { pageId, pageAccessToken } = await getHostPlatform();
  return createFacebookPost({
    pageAccessToken,
    pageId,
    content: payload.content,
    link: payload.link,
    mediaUrls: payload.mediaUrls,
  });
}

export async function deleteFacebookPost(
  postId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { pageAccessToken } = await getHostPlatform();
    const url = `https://graph.facebook.com/v21.0/${postId}?access_token=${pageAccessToken}`;
    const res = await fetch(url, { method: "DELETE" });
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as {
        error?: { message?: string };
      };
      return {
        success: false,
        error: err?.error?.message || `Facebook returned ${res.status}`,
      };
    }
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}