// apps/web/src/lib/app-promotion/caption.ts
import type { PromoSeenItem } from "@prisma/client";

export const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=cshad.isentinel.news&hl=en";

const APP_CTA =
  "Get daily South African news, tenders, jobs, and bursaries in one app.\n" +
  `Download CSHAD iSentinel: ${PLAY_STORE_URL}`;

/**
 * Builds the Facebook caption for a given PromoSeenItem.
 *
 * Every caption carries the Play Store CTA. Every caption links to the
 * bridge page, not directly to the source. The bridge page then carries
 * both the source link and the Play Store CTA.
 */
export function buildCaption(item: PromoSeenItem, bridgeUrl: string): string {
  if (item.externalType === "NEWS") {
    const source = item.sourceName ? `Source: ${item.sourceName}\n` : "";
    return `${item.title}\n\n${source}Full story: ${bridgeUrl}\n\n${APP_CTA}`;
  }

  const org = item.sourceName ? `${item.sourceName}\n` : "";
  return `${item.title}\n${org}Details: ${bridgeUrl}\n\n${APP_CTA}`;
}

export function buildBridgeUrl(baseUrl: string, itemId: string): string {
  const trimmed = baseUrl.replace(/\/+$/, "");
  return `${trimmed}/go/${itemId}`;
}