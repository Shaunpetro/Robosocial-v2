// apps/web/src/lib/app-promotion/caption.ts

const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=cshad.isentinel.news&hl=en";

const APP_NAME = "CSHAD iSentinel News";

export interface CaptionItem {
  id: string;
  externalType: string;
  title: string;
  sourceUrl: string | null;
  imageUrl: string | null;
  sourceName: string | null;
  publishedAt: Date | null;
}

export interface CaptionInput {
  item: CaptionItem;
  bridgeUrl: string;
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trimEnd() + "\u2026";
}

function formatClosingDate(value: Date | null): string | null {
  if (!value) return null;
  return value.toISOString().slice(0, 10);
}

/**
 * Build the Facebook caption for a single promo item.
 *
 * Captions are constructed from fixed templates. This keeps the voice
 * consistent across every post and the cost at zero.
 */
export function buildCaption({ item, bridgeUrl }: CaptionInput): string {
  const title = truncate(item.title, 220);

  const ctaBlock =
    `Get ${APP_NAME} for daily South African news, tenders, jobs, and bursaries.\n` +
    `Download: ${PLAY_STORE_URL}`;

  if (item.externalType === "NEWS") {
    const sourceLine = item.sourceName ? `Source: ${item.sourceName}\n` : "";
    return `${title}\n\n${sourceLine}Full story: ${bridgeUrl}\n\n${ctaBlock}`;
  }

  const orgLine = item.sourceName ? `${item.sourceName}\n` : "";
  const closing = formatClosingDate(item.publishedAt);
  const closingLine = closing ? `Closing: ${closing}\n` : "";

  return `${title}\n${orgLine}${closingLine}\nFull details: ${bridgeUrl}\n\n${ctaBlock}`;
}

export function buildBridgeUrl(baseUrl: string, itemId: string): string {
  const trimmed = baseUrl.replace(/\/+$/, "");
  return `${trimmed}/go/${itemId}`;
}

export function getPlayStoreUrl(): string {
  return PLAY_STORE_URL;
}